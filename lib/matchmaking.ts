import type { PlayerRow, PlayerRatingRow, Category } from '@/lib/database.types';

export interface MatchCandidate {
  player: PlayerRow;
  rating: PlayerRatingRow;
}

export interface MatchmakingOptions {
  /** Pairs (as `${idA}:${idB}` sorted) this session has already seen recently. */
  seenPairs: Set<string>;
  /** Small chance [0,1] of an intentional mismatch for calibration (upset potential / new-player discovery). */
  calibrationRate?: number;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join(':');
}

/**
 * Client-side candidate picker used to build the *shortlist* sent to the
 * `next_matchup` RPC (which does the authoritative, race-safe selection and
 * also updates last_compared_at). Mirrors the priority order from the spec:
 *   1. similar ranking scores
 *   2. not recently compared by this session
 *   3. fewer total votes (so new/under-voted players surface)
 *   4. occasional higher-vs-lower comparison for calibration
 *
 * Never returns a player against themselves, and (for position categories)
 * only pairs players sharing the same position — enforced by the caller
 * filtering `pool` to one position (or, for 'overall', to draft-relevant
 * positions QB/RB/WR/TE) before calling this function.
 */
export function pickMatchup(
  pool: MatchCandidate[],
  options: MatchmakingOptions
): [MatchCandidate, MatchCandidate] | null {
  if (pool.length < 2) return null;

  const { seenPairs, calibrationRate = 0.12 } = options;

  // Bias toward under-voted players: weight = 1 / sqrt(comparisons + 1).
  const weighted = pool
    .map((c) => ({ c, weight: 1 / Math.sqrt(c.rating.comparisons + 1) }))
    .sort((a, b) => b.weight - a.weight);

  const anchorPool = weighted.slice(0, Math.max(20, Math.ceil(weighted.length * 0.4)));
  const anchor = anchorPool[Math.floor(Math.random() * anchorPool.length)].c;

  const doCalibration = Math.random() < calibrationRate;

  const candidates = pool
    .filter((c) => c.player.id !== anchor.player.id)
    .map((c) => {
      const ratingGap = Math.abs(c.rating.rating - anchor.rating.rating);
      const seen = seenPairs.has(pairKey(anchor.player.id, c.player.id));
      const underVoted = 1 / Math.sqrt(c.rating.comparisons + 1);
      // Lower score = better match under normal mode; calibration mode
      // instead rewards a LARGE rating gap to surface a favourite-vs-
      // underdog comparison every so often.
      const gapScore = doCalibration ? -ratingGap : ratingGap;
      const score = gapScore / 40 - underVoted * 25 + (seen ? 500 : 0) + Math.random() * 15;
      return { c, score };
    })
    .sort((a, b) => a.score - b.score);

  const opponent = candidates[0]?.c;
  if (!opponent) return null;

  return Math.random() < 0.5 ? [anchor, opponent] : [opponent, anchor];
}

/** Filters the full player pool down to what's eligible for a given category. */
export function poolForCategory(
  players: PlayerRow[],
  category: Category
): PlayerRow[] {
  if (category === 'overall') {
    // Overall voting stays draft-relevant: skill positions only, no K/DST,
    // so we never pit a first-round RB against a kicker.
    return players.filter((p) => ['QB', 'RB', 'WR', 'TE'].includes(p.position) && p.fantasy_relevant);
  }
  const positionMap: Record<Category, string> = {
    overall: '',
    qb: 'QB',
    rb: 'RB',
    wr: 'WR',
    te: 'TE',
    k: 'K',
    dst: 'DST',
  };
  return players.filter((p) => p.position === positionMap[category] && p.fantasy_relevant);
}
