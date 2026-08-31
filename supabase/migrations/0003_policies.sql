-- RankUp Fantasy — Row Level Security
-- Principle: anonymous + authenticated users can READ freely, and can INSERT
-- only the append-only rows that represent "casting a vote" — but never via
-- a raw table write for anything that mutates ratings or aggregates. All
-- rating math is confined to the SECURITY DEFINER functions in 0002.

alter table players enable row level security;
alter table player_ratings enable row level security;
alter table votes enable row level security;
alter table trades enable row level security;
alter table trade_players enable row level security;
alter table trade_votes enable row level security;
alter table favourites enable row level security;
alter table rate_limit_log enable row level security;

-- players: public read
create policy "players are publicly readable"
  on players for select
  using (true);

-- player_ratings: public read only. No insert/update/delete policy exists
-- for anon/authenticated, so the only write path is the SECURITY DEFINER
-- cast_vote() function, which runs as the table owner and bypasses RLS.
create policy "player ratings are publicly readable"
  on player_ratings for select
  using (true);

-- votes: public read (powers "X total votes" displays), but INSERT must go
-- through cast_vote() — there is deliberately no direct insert policy here.
-- (cast_vote runs as SECURITY DEFINER so it can insert regardless.)
create policy "votes are publicly readable"
  on votes for select
  using (true);

-- trades: public read of open trades; only the RPC creates rows.
create policy "trades are publicly readable"
  on trades for select
  using (true);

create policy "trade players are publicly readable"
  on trade_players for select
  using (true);

create policy "trade votes are publicly readable"
  on trade_votes for select
  using (true);

-- favourites: a user can only see/manage their own favourites.
create policy "users manage their own favourites"
  on favourites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rate_limit_log: never exposed to clients at all (no policies = no access
-- for anon/authenticated; only SECURITY DEFINER functions touch it).
