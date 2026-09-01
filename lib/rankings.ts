import { seedRatingFromRank } from '@/lib/elo';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Category, PlayerRow } from '@/lib/database.types';
import type { RankingRow } from '@/components/RankingsTable';

const ACTIVE_POSITIONS = ['QB', 'RB', 'WR', 'TE'] as const;
const ACTIVE_CATEGORIES = ['overall', 'qb', 'rb', 'wr', 'te'] as const;

type ActiveCategory = (typeof ACTIVE_CATEGORIES)[number];

interface RatingSnapshot {
  player_id: string;
  category: ActiveCategory;
  rating: number;
  comparisons: number;
  wins: number;
  losses: number;
}

interface RankedSnapshot {
  player: Pick<PlayerRow, 'id' | 'full_name' | 'position' | 'team_abbreviation' | 'bye_week' | 'slug' | 'seed_rank_overall' | 'seed_rank_position'>;
  rating: number;
  comparisons: number;
  wins: number;
  losses: number;
  rank: number;
}

/**
 * Sleeper ADP is the low-traffic baseline; real votes progressively take
 * control. At 20 comparisons community Elo reaches its maximum 80% weight,
 * leaving a small market anchor so thin or coordinated bursts cannot
 * completely scramble the table.
 */
export function blendedRankingRating(
  communityRating: number,
  seedRank: number | null,
  poolSize: number,
  comparisons: number
): number {
  if (!seedRank) return communityRating;
  const marketRating = seedRatingFromRank(seedRank, poolSize);
  const communityWeight = Math.min(0.8, Math.max(0, comparisons) / 25);
  return marketRating * (1 - communityWeight) + communityRating * communityWeight;
}

export async function fetchRankings(category: Category, limit: number): Promise<RankingRow[]> {
  if (!isSupabaseConfigured() || !ACTIVE_CATEGORIES.includes(category as ActiveCategory)) return [];

  const supabase = createServerSupabaseClient();
  const [{ data: players, error: playersError }, { data: ratings, error: ratingsError }] = await Promise.all([
    supabase
      .from('players')
      .select('id, full_name, position, team_abbreviation, bye_week, slug, seed_rank_overall, seed_rank_position')
      .eq('fantasy_relevant', true)
      .eq('active', true)
      .in('position', [...ACTIVE_POSITIONS]),
    supabase
      .from('player_ratings')
      .select('player_id, category, rating, comparisons, wins, losses')
      .in('category', [...ACTIVE_CATEGORIES])
      .limit(3000),
  ]);

  if (playersError || !players) {
    console.error('Failed to load ranked players', playersError);
    return [];
  }
  if (ratingsError) console.error('Failed to load player ratings', ratingsError);

  const activePlayers = players as RankedSnapshot['player'][];
  const ratingByCategoryAndPlayer = new Map<string, RatingSnapshot>();
  for (const rating of (ratings ?? []) as RatingSnapshot[]) {
    ratingByCategoryAndPlayer.set(`${rating.category}:${rating.player_id}`, rating);
  }

  const rankedByCategory = new Map<ActiveCategory, RankedSnapshot[]>();
  for (const activeCategory of ACTIVE_CATEGORIES) {
    const categoryPlayers = activeCategory === 'overall'
      ? activePlayers
      : activePlayers.filter((player) => player.position.toLowerCase() === activeCategory);
    const poolSize = categoryPlayers.length;

    const ranked = categoryPlayers
      .map((player) => {
        const snapshot = ratingByCategoryAndPlayer.get(`${activeCategory}:${player.id}`);
        const seedRank = activeCategory === 'overall' ? player.seed_rank_overall : player.seed_rank_position;
        return {
          player,
          rating: blendedRankingRating(snapshot?.rating ?? 1500, seedRank, poolSize, snapshot?.comparisons ?? 0),
          comparisons: snapshot?.comparisons ?? 0,
          wins: snapshot?.wins ?? 0,
          losses: snapshot?.losses ?? 0,
          rank: 0,
        };
      })
      .filter((row) => activeCategory !== 'overall' || row.player.seed_rank_overall !== null)
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        const aSeed = activeCategory === 'overall' ? a.player.seed_rank_overall : a.player.seed_rank_position;
        const bSeed = activeCategory === 'overall' ? b.player.seed_rank_overall : b.player.seed_rank_position;
        if (aSeed !== bSeed) return (aSeed ?? Number.MAX_SAFE_INTEGER) - (bSeed ?? Number.MAX_SAFE_INTEGER);
        return a.player.full_name.localeCompare(b.player.full_name);
      })
      .map((row, index) => ({ ...row, rank: index + 1 }));

    rankedByCategory.set(activeCategory, ranked);
  }

  const selected = rankedByCategory.get(category as ActiveCategory) ?? [];
  const overallRank = new Map((rankedByCategory.get('overall') ?? []).map((row) => [row.player.id, row.rank]));
  const positionRank = new Map<string, number>();
  for (const positionCategory of ['qb', 'rb', 'wr', 'te'] as const) {
    for (const row of rankedByCategory.get(positionCategory) ?? []) {
      positionRank.set(row.player.id, row.rank);
    }
  }

  return selected.slice(0, limit).map((row) => {
    const seedRank = category === 'overall' ? row.player.seed_rank_overall : row.player.seed_rank_position;
    return {
      rank: row.rank,
      player_id: row.player.id,
      slug: row.player.slug,
      full_name: row.player.full_name,
      position: row.player.position,
      team_abbreviation: row.player.team_abbreviation,
      bye_week: row.player.bye_week,
      rating: row.rating,
      comparisons: row.comparisons,
      wins: row.wins,
      losses: row.losses,
      seed_rank_overall: row.player.seed_rank_overall,
      seed_rank_position: row.player.seed_rank_position,
      movement: typeof seedRank === 'number' ? seedRank - row.rank : null,
      position_rank: positionRank.get(row.player.id) ?? null,
      overall_rank: overallRank.get(row.player.id) ?? null,
    } satisfies RankingRow;
  });
}
