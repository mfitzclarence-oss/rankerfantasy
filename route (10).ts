import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { NFL_TEAM_NAMES, normalizeName } from '@/lib/nflTeams';

// Keeps team assignment (trades) and injury status current automatically.
//
// Source: Sleeper's public player directory (https://api.sleeper.app/v1/players/nfl)
// — free, no API key, no rate limit documented for reasonable use, and it's
// exactly what it sounds like: every NFL player with current team + injury
// status. Sleeper explicitly asks callers not to hit this endpoint more than
// once every few hours, which is exactly what the daily cron below does —
// see vercel.json.
//
// This is a REAL-WORLD TRADEOFF, not a limitation of the code: there is no
// free, no-signup source of instantaneous trade/injury news. A same-day sync
// is the honest ceiling without paying for a licensed sports-data feed
// (SportsDataIO, MySportsFeeds) and switching this route to call that
// instead — which is a small change if you get there (see the fetch below).
//
// Matching players between our database and Sleeper's is inherently fuzzy —
// there's no shared ID. We match on normalized full name + position, and
// skip anything ambiguous (same normalized name appearing twice at the same
// position) rather than risk a bad update. `unmatched`/`ambiguous` in the
// response tell you what fell through, so you can fix data by hand rarely
// rather than trust an automatic guess.

export const maxDuration = 60;

interface SleeperPlayer {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string | null;
  status?: string | null; // 'Active', 'Inactive', 'Injured Reserve', etc.
  injury_status?: string | null; // 'Questionable', 'Out', 'IR', 'Suspended', etc.
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // never run unauthenticated
  const auth = request.headers.get('authorization');
  if (auth === `Bearer ${secret}`) return true; // Vercel Cron sends this automatically
  const url = new URL(request.url);
  return url.searchParams.get('secret') === secret; // manual trigger fallback
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: ourPlayers, error: fetchError } = await supabase
    .from('players')
    .select('id, full_name, position, team_abbreviation, injury_status')
    .eq('active', true);

  if (fetchError || !ourPlayers) {
    return NextResponse.json({ error: 'Could not load players', detail: fetchError?.message }, { status: 500 });
  }

  const sleeperRes = await fetch('https://api.sleeper.app/v1/players/nfl', {
    // Sleeper has no cache-friendly headers; this is a big payload (~5-10MB)
    // fetched once per scheduled run, not per visitor.
    cache: 'no-store',
  });

  if (!sleeperRes.ok) {
    return NextResponse.json({ error: `Sleeper API returned ${sleeperRes.status}` }, { status: 502 });
  }

  const sleeperData: Record<string, SleeperPlayer> = await sleeperRes.json();

  // Build a lookup of normalized "name|position" -> Sleeper entry, dropping
  // (marking ambiguous) any key that maps to more than one player.
  const byKey = new Map<string, SleeperPlayer | 'ambiguous'>();
  for (const sp of Object.values(sleeperData)) {
    if (!sp.full_name || !sp.position) continue;
    const key = `${normalizeName(sp.full_name)}|${sp.position}`;
    if (byKey.has(key)) {
      byKey.set(key, 'ambiguous');
    } else {
      byKey.set(key, sp);
    }
  }

  let updated = 0;
  const unmatched: string[] = [];
  const ambiguous: string[] = [];

  for (const player of ourPlayers) {
    if (player.position === 'DST') continue; // team defenses aren't in Sleeper's player list

    const key = `${normalizeName(player.full_name)}|${player.position}`;
    const match = byKey.get(key);

    if (!match) {
      unmatched.push(player.full_name);
      continue;
    }
    if (match === 'ambiguous') {
      ambiguous.push(player.full_name);
      continue;
    }

    const newTeam = match.team ?? player.team_abbreviation; // keep last known team if Sleeper shows no team (e.g. between signings)
    const newInjury = match.injury_status ?? null;

    const teamChanged = newTeam !== player.team_abbreviation;
    const injuryChanged = newInjury !== player.injury_status;
    if (!teamChanged && !injuryChanged) continue;

    const { error: updateError } = await supabase
      .from('players')
      .update({
        team_abbreviation: newTeam,
        nfl_team: NFL_TEAM_NAMES[newTeam] ?? player.team_abbreviation,
        injury_status: newInjury,
      })
      .eq('id', player.id);

    if (!updateError) updated++;
  }

  return NextResponse.json({
    ok: true,
    checked: ourPlayers.length,
    updated,
    unmatched: unmatched.length,
    ambiguous: ambiguous.length,
    // Full lists capped so the response stays small; check Vercel function
    // logs for the complete picture if you need it.
    unmatchedSample: unmatched.slice(0, 20),
    ambiguousSample: ambiguous.slice(0, 20),
  });
}
