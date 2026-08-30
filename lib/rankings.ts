import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Category } from '@/lib/database.types';
import type { RankingRow } from '@/components/RankingsTable';

export async function fetchRankings(category: Category, limit: number): Promise<RankingRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('player_ratings')
    .select(
      'rating, comparisons, wins, losses, players(id, full_name, position, team_abbreviation, bye_week, slug, seed_rank_overall, seed_rank_position, jersey_number)'
    )
    .eq('category', category)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any, i: number) => {
    const seedRank = category === 'overall' ? row.players.seed_rank_overall : row.players.seed_rank_position;
    const movement = typeof seedRank === 'number' ? seedRank - (i + 1) : null;
    return {
      rank: i + 1,
      player_id: row.players.id,
      slug: row.players.slug,
      full_name: row.players.full_name,
      position: row.players.position,
      team_abbreviation: row.players.team_abbreviation,
      jersey_number: row.players.jersey_number,
      bye_week: row.players.bye_week,
      rating: row.rating,
      comparisons: row.comparisons,
      wins: row.wins,
      losses: row.losses,
      seed_rank_overall: row.players.seed_rank_overall,
      seed_rank_position: row.players.seed_rank_position,
      movement,
    } satisfies RankingRow;
  });
}
