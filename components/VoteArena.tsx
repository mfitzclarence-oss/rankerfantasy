'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';
import { getSessionId, recordSeenPair } from '@/lib/session';
import { track } from '@/lib/analytics';
import { nextRequiredCategory, notifyTokensChanged, type UnlockProgress } from '@/lib/tokens';
import { PlayerCard } from '@/components/PlayerCard';
import { CategoryTabs } from '@/components/CategoryTabs';
import { TokenBadge } from '@/components/TokenBadge';
import { poolForCategory } from '@/lib/matchmaking';
import type { Category, PlayerRow } from '@/lib/database.types';

interface Matchup {
  a: PlayerRow;
  b: PlayerRow;
}

interface Consensus {
  agree: boolean;
  percent: number;
  totalVotes: number;
  winnerName: string;
}

// Below this many total votes on a specific pairing, a percentage reads as
// noise rather than signal — show an encouraging "you're early" message
// instead of a misleading "100% agree" from a single vote.
const MIN_VOTES_FOR_CONSENSUS = 3;

export function VoteArena({ category, redirectOnLoad = true }: { category: Category; redirectOnLoad?: boolean }) {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [consensus, setConsensus] = useState<Consensus | null>(null);

  const loadMatchup = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sid = sessionId || getSessionId();
    if (!sessionId) setSessionId(sid);

    const { data: pairData, error: rpcError } = await supabase
      .rpc('next_matchup', { p_category: category, p_session_id: sid })
      .single();

    const pair = pairData as { player_a: string; player_b: string } | null;

    // A newly seeded database can have players before its rating rows/RPC
    // shortlist are ready. Fall back to the public player pool so voting is
    // never an empty screen while Supabase finishes seeding.
    if (rpcError || !pair) {
      const { data: fallbackPlayers, error: fallbackError } = await supabase
        .from('players')
        .select('*')
        .eq('fantasy_relevant', true)
        .eq('active', true)
        .limit(500);

      const pool = poolForCategory((fallbackPlayers ?? []) as PlayerRow[], category);
      if (fallbackError || pool.length < 2) {
        setError("Players aren't available yet. Please try again in a moment.");
        setLoading(false);
        return;
      }

      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      setMatchup({ a: shuffled[0], b: shuffled[1] });
      setLoading(false);
      return;
    }

    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .in('id', [pair.player_a, pair.player_b]);

    if (playersError || !players || players.length < 2) {
      setError('Matchup players could not be loaded.');
      setLoading(false);
      return;
    }

    const a = (players as PlayerRow[]).find((p) => p.id === pair.player_a)!;
    const b = (players as PlayerRow[]).find((p) => p.id === pair.player_b)!;
    setMatchup({ a, b });
    setLoading(false);
  }, [category, sessionId, supabase]);

  useEffect(() => {
    setLoading(true);
    setMatchup(null);
    setConsensus(null);
    track('vote_category_selected', { category });
    let cancelled = false;

    async function startGuidedVote() {
      const sid = getSessionId();
      setSessionId(sid);

      if (!redirectOnLoad) {
        loadMatchup();
        return;
      }

      const { data } = await supabase.rpc('get_unlock_progress', { p_session_id: sid }).single();
      if (cancelled) return;

      const nextCategory = data ? nextRequiredCategory(data as UnlockProgress) : null;
      if (nextCategory && nextCategory !== category) {
        router.replace(`/vote/${nextCategory}` as any);
        return;
      }

      loadMatchup();
    }

    startGuidedVote();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, redirectOnLoad]);

  async function loadConsensus(winner: PlayerRow, loser: PlayerRow) {
    const { data, error: consensusError } = await supabase.rpc('get_matchup_consensus', {
      p_category: category,
      p_player_a_id: winner.id,
      p_player_b_id: loser.id,
    });

    if (consensusError || !data) return;

    const rows = data as { player_id: string; vote_count: number }[];
    const winnerVotes = rows.find((r) => r.player_id === winner.id)?.vote_count ?? 0;
    const loserVotes = rows.find((r) => r.player_id === loser.id)?.vote_count ?? 0;
    const totalVotes = winnerVotes + loserVotes;

    if (totalVotes < MIN_VOTES_FOR_CONSENSUS) {
      setConsensus({ agree: true, percent: 0, totalVotes, winnerName: winner.full_name });
      return;
    }

    const percent = Math.round((winnerVotes / totalVotes) * 100);
    setConsensus({ agree: percent >= 50, percent, totalVotes, winnerName: winner.full_name });
  }

  async function handlePick(winnerSide: 'a' | 'b') {
    if (!matchup || exiting) return;
    const winner = winnerSide === 'a' ? matchup.a : matchup.b;
    const loser = winnerSide === 'a' ? matchup.b : matchup.a;
    setExiting(winnerSide === 'a' ? 'right' : 'left');
    setConsensus(null);

    const sid = sessionId || getSessionId();
    recordSeenPair(category, matchup.a.id, matchup.b.id);
    track('player_vote', { category, player_a: matchup.a.id, player_b: matchup.b.id, winner: winner.id });

    const { error: voteError } = await supabase.rpc('cast_vote', {
        p_session_id: sid,
        p_category: category,
        p_player_a_id: matchup.a.id,
        p_player_b_id: matchup.b.id,
        p_winner_id: winner.id,
      });

    if (voteError) {
      setExiting(null);
      setError(voteError.message || 'Your vote could not be saved. Please try again.');
      return;
    }

    notifyTokensChanged();
    loadConsensus(winner, loser);

    const { data: progressData } = await supabase
      .rpc('get_unlock_progress', { p_session_id: sid })
      .single();
    const nextCategory = progressData ? nextRequiredCategory(progressData as UnlockProgress) : null;

    setVoteCount((n) => n + 1);
    setTimeout(() => {
      setExiting(null);
      if (nextCategory && nextCategory !== category) {
        router.push(`/vote/${nextCategory}` as any);
      } else {
        setLoading(true);
        loadMatchup();
      }
    }, 260);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-3 py-5 sm:gap-6 sm:px-4 sm:py-12">
      <CategoryTabs active={category} basePath="/vote" />

      <div className="text-center">
        <h1 className="section-title">Who would you rather have?</h1>
        <p className="mt-1 text-xs text-white/55 sm:text-sm">
          {voteCount > 0 ? `${voteCount} votes this visit — keep going.` : 'Vote three times at QB, RB, WR and TE. The 12-vote run resets next visit.'}
        </p>
        <TokenBadge className="mt-3" />
      </div>

      {consensus && (
        <div
          className={clsx(
            'w-full rounded-xl border px-4 py-2.5 text-center text-sm font-medium',
            consensus.totalVotes < MIN_VOTES_FOR_CONSENSUS
              ? 'border-blue/40 bg-blue/10 text-blue'
              : consensus.agree
                ? 'border-positive/40 bg-positive/10 text-positive'
                : 'border-accent/40 bg-accent/10 text-accent-bright'
          )}
        >
          {consensus.totalVotes < MIN_VOTES_FOR_CONSENSUS
            ? `You're one of the first to vote on this matchup — check back once more votes are in.`
            : consensus.agree
              ? `You're with the crowd — ${consensus.percent}% of voters also picked ${consensus.winnerName}.`
              : `Bold take — only ${consensus.percent}% of voters agree with you on ${consensus.winnerName}.`}
        </div>
      )}

      {error && (
        <div className="card w-full p-6 text-center text-white/70">
          <p>{error}</p>
          <button className="btn-secondary mt-4" onClick={loadMatchup}>Try again</button>
        </div>
      )}

      {!error && (
        <div className="grid w-full grid-cols-1 items-stretch gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
          {loading || !matchup ? (
            <>
              <CardSkeleton />
              <div className="hidden items-center justify-center sm:flex">
                <span className="font-display text-lg font-bold text-white/20">VS</span>
              </div>
              <CardSkeleton />
            </>
          ) : (
            <>
              <PlayerCard player={matchup.a} exiting={exiting === 'right' ? 'right' : null} disabled={!!exiting} onClick={() => handlePick('a')} />
              <div className="flex items-center justify-center py-1 sm:py-0">
                <span className="font-display text-lg font-bold text-white/25">VS</span>
              </div>
              <PlayerCard player={matchup.b} exiting={exiting === 'left' ? 'left' : null} disabled={!!exiting} onClick={() => handlePick('b')} />
            </>
          )}
        </div>
      )}

      <button
        className="text-sm font-medium text-white/40 hover:text-white/70"
        onClick={loadMatchup}
        disabled={loading || !!exiting}
      >
        Skip this matchup →
      </button>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="card flex animate-pulse flex-col items-center gap-4 p-6 sm:p-8">
      <div className="h-9 w-4/5 rounded bg-ink-700 sm:h-12" />
      <div className="h-4 w-2/5 rounded bg-ink-700" />
    </div>
  );
}
