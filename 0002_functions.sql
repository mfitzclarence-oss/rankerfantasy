-- RankerFantasy — RPC functions
-- All rating mutation happens here (SECURITY DEFINER), never via a direct
-- client UPDATE on player_ratings. RLS on player_ratings only grants SELECT
-- to anon/authenticated (see 0003_policies.sql), so this is the sole write path.

-- ---------------------------------------------------------------------------
-- Elo helpers (mirrors lib/elo.ts — keep both in sync if you tune constants)
-- ---------------------------------------------------------------------------
create or replace function elo_k_factor(comparisons integer) returns numeric as $$
begin
  if comparisons < 10 then return 48;
  elsif comparisons < 40 then return 32;
  else return 20;
  end if;
end;
$$ language plpgsql immutable;

create or replace function elo_expected(rating_a numeric, rating_b numeric) returns numeric as $$
begin
  return 1.0 / (1.0 + power(10, (rating_b - rating_a) / 400.0));
end;
$$ language plpgsql immutable;

-- ---------------------------------------------------------------------------
-- cast_vote: record a pairwise vote and atomically update both players'
-- category rating. Runs as one transaction so ratings can never drift out
-- of sync with the vote log.
-- ---------------------------------------------------------------------------
create or replace function cast_vote(
  p_session_id uuid,
  p_category category_enum,
  p_player_a_id uuid,
  p_player_b_id uuid,
  p_winner_id uuid
) returns table (player_a_rating numeric, player_b_rating numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_loser_id uuid;
  v_winner_rating numeric;
  v_loser_rating numeric;
  v_winner_comparisons integer;
  v_loser_comparisons integer;
  v_k_winner numeric;
  v_k_loser numeric;
  v_expected_winner numeric;
  v_new_winner_rating numeric;
  v_new_loser_rating numeric;
  v_recent_count integer;
  v_window_count integer;
begin
  if p_player_a_id = p_player_b_id then
    raise exception 'cannot vote a player against themself';
  end if;
  if p_winner_id <> p_player_a_id and p_winner_id <> p_player_b_id then
    raise exception 'winner must be player_a or player_b';
  end if;

  -- Duplicate-matchup protection: block the same session voting the same
  -- unordered pair in the same category again within 12 hours.
  select count(*) into v_recent_count
  from votes
  where session_id = p_session_id
    and category = p_category
    and created_at > now() - interval '12 hours'
    and ((player_a_id = p_player_a_id and player_b_id = p_player_b_id)
      or (player_a_id = p_player_b_id and player_b_id = p_player_a_id));

  if v_recent_count > 0 then
    raise exception 'duplicate matchup for this session in the last 12 hours';
  end if;

  -- Rate limiting: max 300 votes per session per rolling 10-minute window.
  -- Generous enough for an enthusiastic voter, tight enough to blunt bots.
  select coalesce(sum(count), 0) into v_window_count
  from rate_limit_log
  where session_id = p_session_id
    and bucket = 'vote'
    and window_start > now() - interval '10 minutes';

  if v_window_count >= 300 then
    raise exception 'rate limit exceeded, slow down';
  end if;

  insert into rate_limit_log (session_id, bucket, window_start, count)
  values (p_session_id, 'vote', date_trunc('minute', now()), 1)
  on conflict (session_id, bucket, window_start)
  do update set count = rate_limit_log.count + 1;

  v_loser_id := case when p_winner_id = p_player_a_id then p_player_b_id else p_player_a_id end;

  -- Ensure rating rows exist (defensive — seed script should have created them).
  insert into player_ratings (player_id, category) values (p_player_a_id, p_category) on conflict do nothing;
  insert into player_ratings (player_id, category) values (p_player_b_id, p_category) on conflict do nothing;

  select rating, comparisons into v_winner_rating, v_winner_comparisons
  from player_ratings where player_id = p_winner_id and category = p_category for update;

  select rating, comparisons into v_loser_rating, v_loser_comparisons
  from player_ratings where player_id = v_loser_id and category = p_category for update;

  v_k_winner := elo_k_factor(v_winner_comparisons);
  v_k_loser := elo_k_factor(v_loser_comparisons);
  v_expected_winner := elo_expected(v_winner_rating, v_loser_rating);

  v_new_winner_rating := greatest(800, v_winner_rating + v_k_winner * (1 - v_expected_winner));
  v_new_loser_rating := greatest(800, v_loser_rating + v_k_loser * (0 - (1 - v_expected_winner)));

  update player_ratings
    set rating = v_new_winner_rating, wins = wins + 1, comparisons = comparisons + 1,
        last_compared_at = now()
    where player_id = p_winner_id and category = p_category;

  update player_ratings
    set rating = v_new_loser_rating, losses = losses + 1, comparisons = comparisons + 1,
        last_compared_at = now()
    where player_id = v_loser_id and category = p_category;

  insert into votes (session_id, user_id, category, player_a_id, player_b_id, winner_id)
  values (p_session_id, v_user_id, p_category, p_player_a_id, p_player_b_id, p_winner_id);

  return query select
    (select rating from player_ratings where player_id = p_player_a_id and category = p_category),
    (select rating from player_ratings where player_id = p_player_b_id and category = p_category);
end;
$$;

grant execute on function cast_vote(uuid, category_enum, uuid, uuid, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- next_matchup: authoritative matchup selection (race-safe, server-timed).
-- Mirrors lib/matchmaking.ts's priority order. Client calls this instead of
-- picking a pair itself so two tabs/sessions can't be gamed and so we can
-- tune the algorithm server-side without a redeploy.
-- ---------------------------------------------------------------------------
create or replace function next_matchup(
  p_category category_enum,
  p_session_id uuid
) returns table (player_a uuid, player_b uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_positions position_enum[];
  v_anchor record;
  v_opponent record;
  v_calibration boolean := random() < 0.12;
begin
  v_positions := case
    when p_category = 'overall' then array['QB','RB','WR','TE']::position_enum[]
    when p_category = 'qb' then array['QB']::position_enum[]
    when p_category = 'rb' then array['RB']::position_enum[]
    when p_category = 'wr' then array['WR']::position_enum[]
    when p_category = 'te' then array['TE']::position_enum[]
    when p_category = 'k' then array['K']::position_enum[]
    when p_category = 'dst' then array['DST']::position_enum[]
  end;

  -- Anchor: weighted toward fewer comparisons, i.e. under-voted players
  -- surface more often, from a random offset for variety.
  select p.id as player_id, pr.rating, pr.comparisons into v_anchor
  from players p
  join player_ratings pr on pr.player_id = p.id and pr.category = p_category
  where p.position = any(v_positions) and p.fantasy_relevant and p.active
  order by (1.0 / sqrt(pr.comparisons + 1)) * random() desc
  limit 1;

  if v_anchor.player_id is null then
    return;
  end if;

  -- Opponent: prioritise similar rating, not recently seen by this session,
  -- fewer comparisons; occasionally (calibration mode) prefer a big gap.
  select p.id as player_id into v_opponent
  from players p
  join player_ratings pr on pr.player_id = p.id and pr.category = p_category
  where p.position = any(v_positions)
    and p.fantasy_relevant
    and p.active
    and p.id <> v_anchor.player_id
    and not exists (
      select 1 from votes v
      where v.session_id = p_session_id
        and v.category = p_category
        and v.created_at > now() - interval '3 hours'
        and ((v.player_a_id = v_anchor.player_id and v.player_b_id = p.id)
          or (v.player_a_id = p.id and v.player_b_id = v_anchor.player_id))
    )
  order by
    case when v_calibration
      then -abs(pr.rating - v_anchor.rating)
      else abs(pr.rating - v_anchor.rating)
    end / 40.0
      - (1.0 / sqrt(pr.comparisons + 1)) * 25
      + random() * 15
  limit 1;

  if v_opponent.player_id is null then
    return;
  end if;

  if random() < 0.5 then
    return query select v_anchor.player_id, v_opponent.player_id;
  else
    return query select v_opponent.player_id, v_anchor.player_id;
  end if;
end;
$$;

grant execute on function next_matchup(category_enum, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- cast_trade_vote: record (or update) a session's vote on a trade.
-- ---------------------------------------------------------------------------
create or replace function cast_trade_vote(
  p_trade_id uuid,
  p_session_id uuid,
  p_vote trade_vote_enum
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_window_count integer;
begin
  select coalesce(sum(count), 0) into v_window_count
  from rate_limit_log
  where session_id = p_session_id
    and bucket = 'trade_vote'
    and window_start > now() - interval '10 minutes';

  if v_window_count >= 100 then
    raise exception 'rate limit exceeded, slow down';
  end if;

  insert into rate_limit_log (session_id, bucket, window_start, count)
  values (p_session_id, 'trade_vote', date_trunc('minute', now()), 1)
  on conflict (session_id, bucket, window_start)
  do update set count = rate_limit_log.count + 1;

  insert into trade_votes (trade_id, session_id, user_id, vote)
  values (p_trade_id, p_session_id, v_user_id, p_vote)
  on conflict (trade_id, session_id)
  do update set vote = excluded.vote, user_id = excluded.user_id;
end;
$$;

grant execute on function cast_trade_vote(uuid, uuid, trade_vote_enum) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_trade: inserts a trade + its player legs in one transaction, with
-- basic shape validation (2-6 players a side, no player on both sides).
-- ---------------------------------------------------------------------------
create or replace function create_trade(
  p_session_id uuid,
  p_title text,
  p_format trade_format_enum,
  p_scoring trade_scoring_enum,
  p_league_size league_size_enum,
  p_superflex boolean,
  p_side_a uuid[],
  p_side_b uuid[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_trade_id uuid;
  v_window_count integer;
  v_pid uuid;
begin
  if array_length(p_side_a, 1) is null or array_length(p_side_b, 1) is null then
    raise exception 'both sides of a trade need at least one player';
  end if;
  if array_length(p_side_a, 1) > 6 or array_length(p_side_b, 1) > 6 then
    raise exception 'too many players on one side';
  end if;
  if exists (select 1 from unnest(p_side_a) a where a = any(p_side_b)) then
    raise exception 'a player cannot be on both sides of a trade';
  end if;

  select coalesce(sum(count), 0) into v_window_count
  from rate_limit_log
  where session_id = p_session_id and bucket = 'trade_create' and window_start > now() - interval '1 hour';

  if v_window_count >= 20 then
    raise exception 'rate limit exceeded, slow down';
  end if;

  insert into rate_limit_log (session_id, bucket, window_start, count)
  values (p_session_id, 'trade_create', date_trunc('minute', now()), 1)
  on conflict (session_id, bucket, window_start) do update set count = rate_limit_log.count + 1;

  insert into trades (user_id, session_id, title, format, scoring, league_size, superflex)
  values (v_user_id, p_session_id, p_title, p_format, p_scoring, p_league_size, p_superflex)
  returning id into v_trade_id;

  foreach v_pid in array p_side_a loop
    insert into trade_players (trade_id, side, player_id) values (v_trade_id, 'A', v_pid);
  end loop;
  foreach v_pid in array p_side_b loop
    insert into trade_players (trade_id, side, player_id) values (v_trade_id, 'B', v_pid);
  end loop;

  return v_trade_id;
end;
$$;

grant execute on function create_trade(uuid, text, trade_format_enum, trade_scoring_enum, league_size_enum, boolean, uuid[], uuid[]) to anon, authenticated;
