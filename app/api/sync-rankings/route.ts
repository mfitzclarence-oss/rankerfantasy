import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { normalizeName } from '@/lib/nflTeams';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export const maxDuration = 60;

const ACTIVE_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE']);
const SLEEPER_ADP_URL = 'https://api.sleeper.com/projections/nfl/2026?season_type=regular';

interface SleeperProjection {
  player_id?: string;
  player?: {
    first_name?: string;
    last_name?: string;
    position?: string;
  };
  stats?: {
    adp_ppr?: number;
  };
}

interface RankedAdp {
  key: string;
  adp: number;
  overallRank: number;
  positionRank: number;
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

function projectionKey(projection: SleeperProjection): string | null {
  const firstName = projection.player?.first_name?.trim();
  const lastName = projection.player?.last_name?.trim();
  const position = projection.player?.position;
  if (!firstName || !lastName || !position || !ACTIVE_POSITIONS.has(position)) return null;
  return `${normalizeName(`${firstName} ${lastName}`)}|${position}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminSupabaseClient();
  const [{ data: ourPlayers, error: playersError }, sleeperResponse] = await Promise.all([
    supabase
      .from('players')
      .select('id, full_name, position, seed_rank_overall, seed_rank_position')
      .eq('active', true)
      .eq('fantasy_relevant', true)
      .in('position', [...ACTIVE_POSITIONS]),
    fetch(SLEEPER_ADP_URL, { cache: 'no-store' }),
  ]);

  if (playersError || !ourPlayers) {
    return NextResponse.json({ error: 'Could not load players', detail: playersError?.message }, { status: 500 });
  }
  if (!sleeperResponse.ok) {
    return NextResponse.json({ error: `Sleeper API returned ${sleeperResponse.status}` }, { status: 502 });
  }

  const projections = (await sleeperResponse.json()) as SleeperProjection[];
  const bestByPlayer = new Map<string, { key: string; position: string; adp: number }>();

  for (const projection of projections) {
    const key = projectionKey(projection);
    const position = projection.player?.position;
    const adp = Number(projection.stats?.adp_ppr);
    if (!key || !position || !Number.isFinite(adp) || adp <= 0 || adp >= 999) continue;

    const existing = bestByPlayer.get(key);
    if (!existing || adp < existing.adp) bestByPlayer.set(key, { key, position, adp });
  }

  const ordered = [...bestByPlayer.values()].sort((a, b) => a.adp - b.adp || a.key.localeCompare(b.key));
  const positionCounts = new Map<string, number>();
  const rankingByKey = new Map<string, RankedAdp>();
  ordered.forEach((entry, index) => {
    const positionRank = (positionCounts.get(entry.position) ?? 0) + 1;
    positionCounts.set(entry.position, positionRank);
    rankingByKey.set(entry.key, {
      key: entry.key,
      adp: entry.adp,
      overallRank: index + 1,
      positionRank,
    });
  });

  const updates = ourPlayers.flatMap((player) => {
    const key = `${normalizeName(player.full_name)}|${player.position}`;
    const ranking = rankingByKey.get(key);
    if (!ranking) return [];
    if (
      player.seed_rank_overall === ranking.overallRank
      && player.seed_rank_position === ranking.positionRank
    ) return [];
    return [{ id: player.id, overallRank: ranking.overallRank, positionRank: ranking.positionRank }];
  });

  let updated = 0;
  const failed: string[] = [];
  for (let index = 0; index < updates.length; index += 25) {
    const batch = updates.slice(index, index + 25);
    const results = await Promise.all(batch.map(async (update) => {
      const { error } = await supabase
        .from('players')
        .update({
          seed_rank_overall: update.overallRank,
          seed_rank_position: update.positionRank,
        })
        .eq('id', update.id);
      return { id: update.id, error };
    }));

    for (const result of results) {
      if (result.error) failed.push(result.id);
      else updated++;
    }
  }

  revalidatePath('/', 'layout');
  revalidatePath('/rankings', 'layout');

  return NextResponse.json({
    ok: failed.length === 0,
    source: 'Sleeper 2026 PPR ADP',
    eligibleProjections: ordered.length,
    checked: ourPlayers.length,
    matched: ourPlayers.length - ourPlayers.filter((player) => {
      const key = `${normalizeName(player.full_name)}|${player.position}`;
      return !rankingByKey.has(key);
    }).length,
    updated,
    failed: failed.length,
    failedSample: failed.slice(0, 10),
  }, { status: failed.length > 0 ? 207 : 200 });
}
