-- Adds jersey number (shown on the new JerseyAvatar chip in place of the old
-- initials circle) and a crowd-consensus lookup used to tell a voter whether
-- their pick agreed with the rest of the community.

alter table players add column if not exists jersey_number smallint;

comment on column players.jersey_number is
  'NFL jersey number, kept in sync from Sleeper''s public player directory (see app/api/sync-players/route.ts). Null until the first sync after a player is seeded.';

-- ---------------------------------------------------------------------------
-- get_matchup_consensus: given an unordered player pair + category, returns
-- how many recorded votes picked each side. Used right after a vote is cast
-- to show "N% of voters agree with you" without exposing raw vote rows.
-- Reads only (no security definer needed — votes already has a public
-- select policy), but defined as a function so the client sends one
-- round-trip instead of a raw aggregate query, and so the pairing logic
-- (either player order counts) lives in one place.
-- ---------------------------------------------------------------------------
create or replace function get_matchup_consensus(
  p_category category_enum,
  p_player_a_id uuid,
  p_player_b_id uuid
) returns table (player_id uuid, vote_count integer)
language sql
stable
set search_path = public
as $$
  select winner_id as player_id, count(*)::integer as vote_count
  from votes
  where category = p_category
    and ((player_a_id = p_player_a_id and player_b_id = p_player_b_id)
      or (player_a_id = p_player_b_id and player_b_id = p_player_a_id))
  group by winner_id;
$$;

grant execute on function get_matchup_consensus(category_enum, uuid, uuid) to anon, authenticated;
