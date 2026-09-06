import type { CommunityTeamCardData } from '@/components/CommunityTeamCard';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';

export type CommunityTeamSort = 'new' | 'top' | 'most-rated';

export async function fetchCommunityTeams(sort: CommunityTeamSort): Promise<CommunityTeamCardData[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabaseClient();

  const { data: teams, error } = await supabase
    .from('community_teams')
    .select('id, team_name, scoring, league_size, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(60);

  if (error || !teams?.length) return [];
  const teamIds = teams.map((team) => team.id);

  const [{ data: rosterRows }, { data: summaryRows }] = await Promise.all([
    supabase
      .from('community_team_players')
      .select('team_id, sort_order, players(id, full_name, position, team_abbreviation)')
      .in('team_id', teamIds)
      .order('sort_order', { ascending: true }),
    supabase.rpc('get_community_team_rating_summaries', { p_team_ids: teamIds }),
  ]);

  const summaries = new Map<string, { averageScore: number; ratingCount: number }>();
  for (const row of summaryRows ?? []) {
    summaries.set(row.team_id, {
      averageScore: Number(row.average_score),
      ratingCount: Number(row.rating_count),
    });
  }

  const rostersByTeam = new Map<string, CommunityTeamCardData['players']>();
  for (const row of rosterRows ?? []) {
    const roster = rostersByTeam.get(row.team_id) ?? [];
    if (row.players) roster.push(row.players as unknown as CommunityTeamCardData['players'][number]);
    rostersByTeam.set(row.team_id, roster);
  }

  const cards: CommunityTeamCardData[] = teams.map((team) => {
    const summary = summaries.get(team.id);
    return {
      id: team.id,
      teamName: team.team_name,
      scoring: team.scoring,
      leagueSize: team.league_size,
      createdAt: team.created_at,
      players: rostersByTeam.get(team.id) ?? [],
      averageScore: summary?.averageScore ?? 0,
      ratingCount: summary?.ratingCount ?? 0,
    };
  });

  if (sort === 'top') {
    return cards.sort((a, b) => b.averageScore - a.averageScore || b.ratingCount - a.ratingCount);
  }
  if (sort === 'most-rated') {
    return cards.sort((a, b) => b.ratingCount - a.ratingCount || b.averageScore - a.averageScore);
  }
  return cards;
}
