alter table public.community_team_players
  add column roster_slot text not null default 'BENCH'
  check (roster_slot in ('QB', 'RB', 'WR', 'TE', 'FLEX', 'BENCH'));

-- Give any existing roster entries their natural position rather than the
-- default bench slot. New submissions explicitly send the chosen slot.
update public.community_team_players roster
set roster_slot = player.position::text
from public.players player
where player.id = roster.player_id
  and player.position in ('QB', 'RB', 'WR', 'TE');

create or replace function public.create_community_team(
  p_session_id uuid,
  p_team_name text,
  p_scoring trade_scoring_enum,
  p_league_size league_size_enum,
  p_player_ids uuid[],
  p_roster_slots text[]
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id uuid;
  v_name text := trim(p_team_name);
  v_player_count integer := coalesce(array_length(p_player_ids, 1), 0);
  v_slot_count integer := coalesce(array_length(p_roster_slots, 1), 0);
  v_valid_player_count integer;
  v_unique_player_count integer;
  v_window_count integer;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 50 then
    raise exception 'team name must be between 2 and 50 characters';
  end if;
  if v_player_count < 5 or v_player_count > 24 then
    raise exception 'a team needs between 5 and 24 players';
  end if;
  if v_slot_count <> v_player_count then
    raise exception 'choose a roster position for every player';
  end if;

  select count(distinct selected.player_id) into v_unique_player_count
  from unnest(p_player_ids) as selected(player_id);
  if v_unique_player_count <> v_player_count then
    raise exception 'a player can only appear once on a team';
  end if;

  select count(*) into v_valid_player_count
  from public.players
  where id = any(p_player_ids)
    and active
    and fantasy_relevant
    and position in ('QB', 'RB', 'WR', 'TE');
  if v_valid_player_count <> v_player_count then
    raise exception 'one or more selected players are unavailable';
  end if;

  if exists (
    select 1
    from unnest(p_player_ids, p_roster_slots) as selected(player_id, roster_slot)
    join public.players player on player.id = selected.player_id
    where selected.roster_slot not in ('QB', 'RB', 'WR', 'TE', 'FLEX', 'BENCH')
      or (
        selected.roster_slot not in (player.position::text, 'BENCH')
        and not (selected.roster_slot = 'FLEX' and player.position in ('RB', 'WR', 'TE'))
      )
  ) then
    raise exception 'a player was assigned to an invalid roster position';
  end if;

  select coalesce(sum(count), 0) into v_window_count
  from public.rate_limit_log
  where session_id = p_session_id
    and bucket = 'community_team_create'
    and window_start > now() - interval '1 hour';
  if v_window_count >= 10 then
    raise exception 'team submission limit reached, please try again later';
  end if;

  insert into public.rate_limit_log (session_id, bucket, window_start, count)
  values (p_session_id, 'community_team_create', date_trunc('minute', now()), 1)
  on conflict (session_id, bucket, window_start)
  do update set count = public.rate_limit_log.count + 1;

  insert into public.community_teams (user_id, session_id, team_name, scoring, league_size)
  values ((select auth.uid()), p_session_id, v_name, p_scoring, p_league_size)
  returning id into v_team_id;

  insert into public.community_team_players (team_id, player_id, sort_order, roster_slot)
  select v_team_id, selected.player_id, (selected.ordinality - 1)::smallint, selected.roster_slot
  from unnest(p_player_ids, p_roster_slots) with ordinality
    as selected(player_id, roster_slot, ordinality);

  return v_team_id;
end;
$$;

revoke execute on function public.create_community_team(uuid, text, trade_scoring_enum, league_size_enum, uuid[], text[]) from public;
grant execute on function public.create_community_team(uuid, text, trade_scoring_enum, league_size_enum, uuid[], text[]) to anon, authenticated;

notify pgrst, 'reload schema';
