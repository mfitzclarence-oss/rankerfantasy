import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Category } from '@/lib/database.types';
import type { RankingRow } from '@/components/RankingsTable';

export async function fetchRankings(category: Category, limit: number): Promise<RankingRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('player_ratings')
    .select(
      'rating, comparisons, wins, losses, players(id, full_name, position, team_abbreviation, bye_week, slug, seed_rank_overall, seed_rank_position)'
    )
    .eq('category', category)
    .order('rating', { ascending: false })
    .limit(limit);

  if (!error && data && data.length > 0) {
    return data.flatMap((row: any, i: number) => {
      if (!row.players) return [];
      const seedRank = category === 'overall' ? row.players.seed_rank_overall : row.players.seed_rank_position;
      const movement = typeof seedRank === 'number' ? seedRank - (i + 1) : null;
      return [{
        rank: i + 1,
        player_id: row.players.id,
        slug: row.players.slug,
        full_name: row.players.full_name,
        position: row.players.position,
        team_abbreviation: row.players.team_abbreviation,
        bye_week: row.players.bye_week,
        rating: row.rating,
        comparisons: row.comparisons,
        wins: row.wins,
        losses: row.losses,
        seed_rank_overall: row.players.seed_rank_overall,
        seed_rank_position: row.players.seed_rank_position,
        movement,
      } satisfies RankingRow];
    });
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
    } satisfies RankingRow;
  });
}
