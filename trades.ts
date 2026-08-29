import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { TradeCardData } from '@/components/TradeCard';

export type TradeSort = 'new' | 'top' | 'controversial';

export async function fetchTradeFeed(sort: TradeSort, sessionId?: string): Promise<TradeCardData[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabaseClient();

  const { data: trades } = await supabase
    .from('trades')
    .select('id, title, format, scoring, league_size, superflex, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!trades || trades.length === 0) return [];

  const tradeIds = trades.map((t) => t.id);

  const [{ data: players }, { data: votes }] = await Promise.all([
    supabase.from('trade_players').select('trade_id, side, players(full_name, position)').in('trade_id', tradeIds),
    supabase.from('trade_votes').select('trade_id, vote, session_id').in('trade_id', tradeIds),
  ]);

  const cards: TradeCardData[] = trades.map((t) => {
    const tPlayers = (players ?? []).filter((p: any) => p.trade_id === t.id);
    const tVotes = (votes ?? []).filter((v: any) => v.trade_id === t.id);
    const voteCounts = { team_a: 0, fair: 0, team_b: 0 };
    let userVote: TradeCardData['userVote'] = null;
    for (const v of tVotes) {
      voteCounts[v.vote as keyof typeof voteCounts]++;
      if (sessionId && v.session_id === sessionId) userVote = v.vote;
    }

    return {
      id: t.id,
      title: t.title,
      format: t.format,
      scoring: t.scoring,
      league_size: t.league_size,
      superflex: t.superflex,
      created_at: t.created_at,
      sideA: tPlayers.filter((p: any) => p.side === 'A').map((p: any) => p.players),
      sideB: tPlayers.filter((p: any) => p.side === 'B').map((p: any) => p.players),
      votes: voteCounts,
      userVote,
    };
  });

  if (sort === 'new') return cards;

  if (sort === 'top') {
    return cards.sort((a, b) => totalVotes(b) - totalVotes(a));
  }

  // controversial: closest split between Team A Wins and Team B Wins,
  // weighted so trades need a meaningful sample size to qualify.
  return cards
    .filter((c) => totalVotes(c) >= 3)
    .sort((a, b) => controversyScore(b) - controversyScore(a))
    .concat(cards.filter((c) => totalVotes(c) < 3));
}

function totalVotes(c: TradeCardData) {
  return c.votes.team_a + c.votes.fair + c.votes.team_b;
}

function controversyScore(c: TradeCardData) {
  const total = totalVotes(c);
  if (total === 0) return -Infinity;
  const pctA = c.votes.team_a / total;
  const pctB = c.votes.team_b / total;
  const closeness = 1 - Math.abs(pctA - pctB); // 1 = perfectly split, 0 = unanimous
  return closeness * Math.log2(total + 1); // reward closeness, break ties by sample size
}

export async function fetchTrade(id: string, sessionId?: string): Promise<TradeCardData | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerSupabaseClient();

  const { data: t } = await supabase
    .from('trades')
    .select('id, title, format, scoring, league_size, superflex, created_at')
    .eq('id', id)
    .maybeSingle();
  if (!t) return null;

  const [{ data: players }, { data: votes }] = await Promise.all([
    supabase.from('trade_players').select('side, players(full_name, position)').eq('trade_id', id),
    supabase.from('trade_votes').select('vote, session_id').eq('trade_id', id),
  ]);

  const voteCounts = { team_a: 0, fair: 0, team_b: 0 };
  let userVote: TradeCardData['userVote'] = null;
  for (const v of votes ?? []) {
    voteCounts[v.vote as keyof typeof voteCounts]++;
    if (sessionId && v.session_id === sessionId) userVote = v.vote;
  }

  return {
    id: t.id,
    title: t.title,
    format: t.format,
    scoring: t.scoring,
    league_size: t.league_size,
    superflex: t.superflex,
    created_at: t.created_at,
    sideA: (players ?? []).filter((p: any) => p.side === 'A').map((p: any) => p.players),
    sideB: (players ?? []).filter((p: any) => p.side === 'B').map((p: any) => p.players),
    votes: voteCounts,
    userVote,
  };
}
