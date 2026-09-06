-- Follow-up from Supabase security and performance advisors.

create index community_teams_user_idx
  on public.community_teams (user_id)
  where user_id is not null;

create index community_team_ratings_user_idx
  on public.community_team_ratings (user_id)
  where user_id is not null;

-- Ratings contain session identifiers and are deliberately RPC-only. This
-- explicit false policy documents the boundary and guarantees direct Data API
-- reads remain denied even if a SELECT grant is added accidentally later.
create policy "community team ratings are RPC only"
  on public.community_team_ratings for select
  to anon, authenticated
  using (false);
