/**
 * Elo rating engine.
 *
 * This module is the reference implementation and is used:
 *  1. client-side, for the seed script's initial ADP-based seeding, and
 *  2. as the documented algorithm mirrored inside the `cast_vote` Postgres
 *     function (supabase/migrations/0002_functions.sql) so ratings update
 *     atomically and can't be spoofed by a browser client.
 *
 * If you change the K-factor or expected-score formula, update BOTH places.
 */

export const ELO_BASE_RATING = 1500;
export const ELO_MIN_RATING = 800;

/**
 * K-factor controls how much a single vote can move a rating. We scale K
 * down as a player accumulates more comparisons, so early votes move a
 * player's rating quickly (fast convergence with little data) while
 * well-established players are harder to move with a single upset.
 */
export function kFactor(comparisons: number): number {
  if (comparisons < 10) return 48;
  if (comparisons < 40) return 32;
  return 20;
}

/** Standard Elo expected-score for player A vs player B. */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

export interface EloUpdateResult {
  winnerRating: number;
  loserRating: number;
  winnerDelta: number;
  loserDelta: number;
}

/**
 * Apply one pairwise result. `winnerComparisons`/`loserComparisons` are the
 * comparison counts BEFORE this vote (used to pick each side's K-factor).
 */
export function applyVote(
  winnerRating: number,
  loserRating: number,
  winnerComparisons: number,
  loserComparisons: number
): EloUpdateResult {
  const expectedWinner = expectedScore(winnerRating, loserRating);
  const expectedLoser = 1 - expectedWinner;

  const kWinner = kFactor(winnerComparisons);
  const kLoser = kFactor(loserComparisons);

  const winnerDelta = kWinner * (1 - expectedWinner);
  const loserDelta = kLoser * (0 - expectedLoser);

  const newWinnerRating = Math.max(ELO_MIN_RATING, winnerRating + winnerDelta);
  const newLoserRating = Math.max(ELO_MIN_RATING, loserRating + loserDelta);

  return {
    winnerRating: newWinnerRating,
    loserRating: newLoserRating,
    winnerDelta: newWinnerRating - winnerRating,
    loserDelta: newLoserRating - loserRating,
  };
}

/**
 * Seed an initial Elo rating from a 1-indexed ADP/consensus rank within a
 * pool of `poolSize` players. Rank 1 gets a high seed; the bottom of the
 * pool regresses toward ELO_BASE_RATING. This is only a starting point —
 * live votes very quickly move players away from their seed.
 */
export function seedRatingFromRank(rank: number, poolSize: number): number {
  const top = 1850;
  const bottom = 1350;
  const clampedRank = Math.max(1, Math.min(rank, poolSize));
  const t = (clampedRank - 1) / Math.max(1, poolSize - 1);
  return Math.round(top - t * (top - bottom));
}

export function winPercentage(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 1000) / 10;
}
