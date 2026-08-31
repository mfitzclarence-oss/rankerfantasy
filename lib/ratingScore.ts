/**
 * Convert the internal Elo value into a simple 0–100 RankUp Rating.
 *
 * The category leader is always 100. Everyone else is capped at 99 and
 * separated by both their Elo gap and a small rank-based tie break. The tie
 * break matters while rankings are still seeded and several players share the
 * same Elo value.
 */
export function ratingOutOf100(rating: number, leaderRating: number, rank: number): number {
  if (rank <= 1) return 100;

  const eloGap = Math.max(0, leaderRating - rating);
  const rankTieBreakGap = Math.max(0, rank - 1) * 6;
  const effectiveGap = Math.max(eloGap, rankTieBreakGap);
  const score = Math.round(100 - effectiveGap / 8);

  return Math.max(1, Math.min(99, score));
}
