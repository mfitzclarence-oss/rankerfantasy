-- RankUp Fantasy — core schema
-- Run in order: 0001_init.sql, 0002_functions.sql, 0003_policies.sql
-- (or `supabase db push` picks up all files in supabase/migrations in order)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- players: individual NFL players + team D/ST entities
-- ---------------------------------------------------------------------------
create type position_enum as enum ('QB', 'RB', 'WR', 'TE', 'K', 'DST');

create table players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  first_name text not null,
  last_name text not null,
  position position_enum not null,
  nfl_team text not null,               -- e.g. "Detroit Lions"
  team_abbreviation text not null,      -- e.g. "DET"
  bye_week smallint,
  headshot_url text,
  active boolean not null default true,
  fantasy_relevant boolean not null default true,
  slug text not null unique,            -- e.g. "jahmyr-gibbs", used in /players/[slug]
  external_ref text,                    -- id from the upstream provider (see scripts/seed.ts), for future refreshes
  seed_rank_overall integer,            -- 1-indexed ADP-derived rank at seed time (nullable for K/DST-only ranks)
  seed_rank_position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_players_position on players (position);
create index idx_players_fantasy_relevant on players (fantasy_relevant) where fantasy_relevant;
create index idx_players_slug on players (slug);
create index idx_players_active on players (active) where active;

-- ---------------------------------------------------------------------------
-- player_ratings: one row per (player, category). Category-specific Elo.
-- ---------------------------------------------------------------------------
create type category_enum as enum ('overall', 'qb', 'rb', 'wr', 'te', 'k', 'dst');

create table player_ratings (
  player_id uuid not null references players (id) on delete cascade,
  category category_enum not null,
  rating numeric(8, 2) not null default 1500,
  ranking_score numeric(8, 2) generated always as (rating) stored, -- alias kept for the "ranking_score_*" fields in the spec
  wins integer not null default 0,
  losses integer not null default 0,
  comparisons integer not null default 0,
  last_compared_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (player_id, category)
);

create index idx_player_ratings_category_rating on player_ratings (category, rating desc);
create index idx_player_ratings_comparisons on player_ratings (category, comparisons);

-- ---------------------------------------------------------------------------
-- votes: append-only log of every pairwise comparison
-- ---------------------------------------------------------------------------
create table votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,             -- anonymous session id, always set
  user_id uuid references auth.users (id) on delete set null,
  category category_enum not null,
  player_a_id uuid not null references players (id),
  player_b_id uuid not null references players (id),
  winner_id uuid not null references players (id),
  created_at timestamptz not null default now(),
  constraint votes_winner_is_a_or_b check (winner_id = player_a_id or winner_id = player_b_id),
  constraint votes_distinct_players check (player_a_id <> player_b_id)
);

create index idx_votes_session on votes (session_id, created_at desc);
create index idx_votes_category on votes (category, created_at desc);
create index idx_votes_matchup on votes (category, player_a_id, player_b_id);
create index idx_votes_user on votes (user_id) where user_id is not null;

-- Duplicate-matchup protection: same session can't vote the same unordered
-- pair in the same category more than once every 12 hours (see cast_vote
-- function for the actual enforcement — this index just makes the lookup fast).
create index idx_votes_session_recent on votes (session_id, category, player_a_id, player_b_id, created_at desc);

-- ---------------------------------------------------------------------------
-- trades: a submitted trade proposal
-- ---------------------------------------------------------------------------
create type trade_format_enum as enum ('redraft', 'dynasty', 'keeper');
create type trade_scoring_enum as enum ('standard', 'half_ppr', 'ppr');
create type league_size_enum as enum ('8', '10', '12', '14+');
create type trade_status_enum as enum ('open', 'closed');

create table trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id uuid not null,
  title text,
  format trade_format_enum not null default 'redraft',
  scoring trade_scoring_enum not null default 'half_ppr',
  league_size league_size_enum not null default '12',
  superflex boolean not null default false,
  status trade_status_enum not null default 'open',
  created_at timestamptz not null default now()
);

create index idx_trades_created on trades (created_at desc);
create index idx_trades_status on trades (status);

-- ---------------------------------------------------------------------------
-- trade_players: the players on each side of a trade
-- ---------------------------------------------------------------------------
create type trade_side_enum as enum ('A', 'B');

create table trade_players (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references trades (id) on delete cascade,
  side trade_side_enum not null,
  player_id uuid not null references players (id)
);

create index idx_trade_players_trade on trade_players (trade_id);
create unique index idx_trade_players_unique on trade_players (trade_id, side, player_id);

-- ---------------------------------------------------------------------------
-- trade_votes: community judgment on a trade
-- ---------------------------------------------------------------------------
create type trade_vote_enum as enum ('team_a', 'fair', 'team_b');

create table trade_votes (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references trades (id) on delete cascade,
  session_id uuid not null,
  user_id uuid references auth.users (id) on delete set null,
  vote trade_vote_enum not null,
  created_at timestamptz not null default now()
);

create index idx_trade_votes_trade on trade_votes (trade_id);
-- One vote per session per trade.
create unique index idx_trade_votes_unique_session on trade_votes (trade_id, session_id);

-- ---------------------------------------------------------------------------
-- favourites (Phase 3 — registered users only)
-- ---------------------------------------------------------------------------
create table favourites (
  user_id uuid not null references auth.users (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, player_id)
);

-- ---------------------------------------------------------------------------
-- rate_limit_log — lightweight abuse guard, checked inside the RPCs
-- ---------------------------------------------------------------------------
create table rate_limit_log (
  session_id uuid not null,
  bucket text not null,          -- 'vote' | 'trade_vote' | 'trade_create'
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (session_id, bucket, window_start)
);

-- updated_at maintenance
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_players_updated_at before update on players
  for each row execute function set_updated_at();

create trigger trg_player_ratings_updated_at before update on player_ratings
  for each row execute function set_updated_at();
