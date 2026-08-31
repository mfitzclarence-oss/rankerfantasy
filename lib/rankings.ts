import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Category } from '@/lib/database.types';
import type { RankingRow } from '@/components/RankingsTable';

export async function fetchRankings(category: Category, limit: number): Promise<RankingRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabaseClient();
  const { data: ratings, error: ratingsError } = await supabase
    .from('player_ratings')
    .select('player_id, rating, comparisons, wins, losses')
    .eq('category', category)
    .order('rating', { ascending: false })
    .limit(limit);

  if (ratingsError) console.error('Failed to load player ratings', ratingsError);

  if (ratings && ratings.length > 0) {
    const playerIds = ratings.map((row) => row.player_id);
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, full_name, position, team_abbreviation, bye_week, slug, seed_rank_overall, seed_rank_position')
      .in('id', playerIds)
      .eq('fantasy_relevant', true)
      .eq('active', true);

    if (playersError) console.error('Failed to load ranked players', playersError);

    if (players && players.length > 0) {
      const overallRankMap = new Map<string, number>();
      const positionRankMap = new Map<string, number>();

      if (category === 'overall') {
        const { data: positionRatings } = await supabase
          .from('player_ratings')
          .select('player_id, category, rating')
          .in('category', ['qb', 'rb', 'wr', 'te'])
          .order('rating', { ascending: false })
          .limit(2000);
        const positionCounters = new Map<string, number>();
        for (const row of positionRatings ?? []) {
          const nextRank = (positionCounters.get(row.category) ?? 0) + 1;
          positionCounters.set(row.category, nextRank);
          positionRankMap.set(`${row.category}:${row.player_id}`, nextRank);
        }
      } else {
        const { data: overallRatings } = await supabase
          .from('player_ratings')
          .select('player_id, rating')
          .eq('category', 'overall')
          .order('rating', { ascending: false })
          .limit(2000);
        (overallRatings ?? []).forEach((row, index) => overallRankMap.set(row.player_id, index + 1));
      }

      const playersById = new Map(players.map((player) => [player.id, player]));
      let visibleRank = 0;
      return ratings.flatMap((row) => {
        const player = playersById.get(row.player_id);
        if (!player) return [];
        const rank = ++visibleRank;
        const seedRank = category === 'overall' ? player.seed_rank_overall : player.seed_rank_position;
        const movement = typeof seedRank === 'number' ? seedRank - rank : null;
        return [{
          rank,
          player_id: player.id,
          slug: player.slug,
          full_name: player.full_name,
          position: player.position,
          team_abbreviation: player.team_abbreviation,
          bye_week: player.bye_week,
          rating: row.rating,
          comparisons: row.comparisons,
          wins: row.wins,
          losses: row.losses,
          seed_rank_overall: player.seed_rank_overall,
          seed_rank_position: player.seed_rank_position,
          movement,
          position_rank: category === 'overall' ? positionRankMap.get(`${player.position.toLowerCase()}:${player.id}`) ?? null : rank,
          overall_rank: category === 'overall' ? rank : overallRankMap.get(player.id) ?? null,
        } satisfies RankingRow];
      });
    }
  }

  // Ratings are populated separately from players. Use the draft seed as a
  // useful initial ranking until community votes create rating rows.
  const position = category === 'dst' ? 'DST' : category.toUpperCase();
  let query = supabase
    .from('players')
    .select('id, full_name, position, team_abbreviation, bye_week, slug, seed_rank_overall, seed_rank_position')
    .eq('fantasy_relevant', true)
    .eq('active', true);
  if (category === 'overall') query = query.in('position', ['QB', 'RB', 'WR', 'TE']);
  else query = query.eq('position', position);

  const seedColumn = category === 'overall' ? 'seed_rank_overall' : 'seed_rank_position';
  const { data: players, error: playersError } = await query
    .not(seedColumn, 'is', null)
    .order(seedColumn, { ascending: true })
    .limit(limit);
  if (playersError || !players) return [];

  return players.map((player: any, i: number) => {
    return {
      rank: i + 1,
      player_id: player.id,
      slug: player.slug,
      full_name: player.full_name,
      position: player.position,
      team_abbreviation: player.team_abbreviation,
      bye_week: player.bye_week,
      rating: 1500,
      comparisons: 0,
      wins: 0,
      losses: 0,
      seed_rank_overall: player.seed_rank_overall,
      seed_rank_position: player.seed_rank_position,
      movement: 0,
      position_rank: category === 'overall' ? null : player.seed_rank_position ?? i + 1,
      overall_rank: category === 'overall' ? i + 1 : player.seed_rank_overall ?? null,
    } satisfies RankingRow;
  });
}
