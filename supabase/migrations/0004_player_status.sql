-- Adds injury status, used by the automated sync job (see
-- app/api/sync-players/route.ts) so player cards and profiles can show
-- Questionable/Out/IR/etc. without any manual data entry.
alter table players add column if not exists injury_status text;

comment on column players.injury_status is
  'Free-text status from the sync source (e.g. Questionable, Out, IR, Suspended). Null = healthy/active. Updated automatically by /api/sync-players.';
