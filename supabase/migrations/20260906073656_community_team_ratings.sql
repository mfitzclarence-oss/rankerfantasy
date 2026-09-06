-- Community roster submissions and 1-10 ratings.
-- Uses the existing scoring, league-size and open/closed enums so the feature
-- remains consistent with Trade Vote without changing any existing objects.

create table public.community_teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id uuid not null,
  team_name text not null check (char_length(team_name) between 2 and 50),
  scoring trade_scoring_enum not null default 'half_ppr',
  league_size league_size_enum not null default '12',
  status trade_status_enum not null default 'open',
  created_at timestamptz not null default now()
);

create index community_teams_status_created_idx
  on public.community_teams (status, created_at desc);
create index community_teams_session_created_idx
  on public.community_teams (session_id, created_at desc);

create table public.community_team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.community_teams (id) on delete cascade,
  player_id uuid not null references public.players (id),
  sort_order smallint not null check (sort_order between 0 and 23),
  unique (team_id, player_id),
  unique (team_id, sort_order)
);

create index community_team_players_team_idx
  on public.community_team_players (team_id, sort_order);
create index community_team_players_player_idx
  on public.community_team_players (player_id);

create table public.community_team_ratings (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.community_teams (id) on delete cascade,
  session_id uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  score smallint not null check (score between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, session_id)
);

create index community_team_ratings_team_idx
  on public.community_team_ratings (team_id);
create index community_team_ratings_session_idx
  on public.community_team_ratings (session_id, created_at desc);

create trigger community_team_ratings_updated_at
  before update on public.community_team_ratings
  for each row execute function public.set_updated_at();

alter table public.community_teams enable row level security;
alter table public.community_team_players enable row level security;
alter table public.community_team_ratings enable row level security;

revoke all on table public.community_teams from anon, authenticated;
revoke all on table public.community_team_players from anon, authenticated;
revoke all on table public.community_team_ratings from anon, authenticated;

grant select on table public.community_teams to anon, authenticated;
grant select on table public.community_team_players to anon, authenticated;

create policy "open community teams are publicly readable"
  on public.community_teams for select
  to anon, authenticated
  using (status = 'open');

create policy "players on open community teams are publicly readable"
  on public.community_team_players for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.community_teams t
      where t.id = team_id and t.status = 'open'
    )
  );

create or replace function public.create_community_team(
  p_session_id uuid,
  p_team_name text,
  p_scoring trade_scoring_enum,
  p_league_size league_size_enum,
  p_player_ids uuid[]
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id uuid;
  v_name text := trim(p_team_name);
  v_player_count integer := coalesce(array_length(p_player_ids, 1), 0);
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

  insert into public.community_team_players (team_id, player_id, sort_order)
  select v_team_id, player_id, (ordinality - 1)::smallint
  from unnest(p_player_ids) with ordinality as selected(player_id, ordinality);

  return v_team_id;
end;
$$;

revoke execute on function public.create_community_team(uuid, text, trade_scoring_enum, league_size_enum, uuid[]) from public;
grant execute on function public.create_community_team(uuid, text, trade_scoring_enum, league_size_enum, uuid[]) to anon, authenticated;

create or replace function public.cast_community_team_rating(
  p_team_id uuid,
  p_session_id uuid,
  p_score smallint
) returns table (average_score numeric, rating_count bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_count integer;
begin
  if p_score < 1 or p_score > 10 then
    raise exception 'rating must be between 1 and 10';
  end if;
  if not exists (
    select 1 from public.community_teams
    where id = p_team_id and status = 'open'
  ) then
    raise exception 'team is not available for rating';
  end if;

  select coalesce(sum(count), 0) into v_window_count
  from public.rate_limit_log
  where session_id = p_session_id
    and bucket = 'community_team_rating'
    and window_start > now() - interval '10 minutes';
  if v_window_count >= 100 then
    raise exception 'rating limit reached, please slow down';
  end if;

  insert into public.rate_limit_log (session_id, bucket, window_start, count)
  values (p_session_id, 'community_team_rating', date_trunc('minute', now()), 1)
  on conflict (session_id, bucket, window_start)
  do update set count = public.rate_limit_log.count + 1;

  insert into public.community_team_ratings (team_id, session_id, user_id, score)
  values (p_team_id, p_session_id, (select auth.uid()), p_score)
  on conflict (team_id, session_id)
  do update set
    score = excluded.score,
    user_id = excluded.user_id,
    updated_at = now();

  return query
  select round(avg(r.score), 1), count(*)
  from public.community_team_ratings r
  where r.team_id = p_team_id;
end;
$$;

revoke execute on function public.cast_community_team_rating(uuid, uuid, smallint) from public;
grant execute on function public.cast_community_team_rating(uuid, uuid, smallint) to anon, authenticated;

create or replace function public.get_community_team_rating_summaries(p_team_ids uuid[])
returns table (team_id uuid, average_score numeric, rating_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select r.team_id, round(avg(r.score), 1), count(*)
  from public.community_team_ratings r
  where r.team_id = any(p_team_ids)
  group by r.team_id;
$$;

revoke execute on function public.get_community_team_rating_summaries(uuid[]) from public;
grant execute on function public.get_community_team_rating_summaries(uuid[]) to anon, authenticated;

create or replace function public.get_my_community_team_rating(
  p_team_id uuid,
  p_session_id uuid
) returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select score
  from public.community_team_ratings
  where team_id = p_team_id and session_id = p_session_id;
$$;

revoke execute on function public.get_my_community_team_rating(uuid, uuid) from public;
grant execute on function public.get_my_community_team_rating(uuid, uuid) to anon, authenticated;
