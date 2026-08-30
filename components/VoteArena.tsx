'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSessionId, recordSeenPair } from '@/lib/session';
import { track } from '@/lib/analytics';
import { notifyTokensChanged } from '@/lib/tokens';
import { PlayerCard } from '@/components/PlayerCard';
import { CategoryTabs } from '@/components/CategoryTabs';
import type { Category, PlayerRow } from '@/lib/database.types';

interface Matchup {
  a: PlayerRow;
  b: PlayerRow;
}

export function VoteArena({ category }: { category: Category }) {
  const [supabase] = useState(createClient);
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [sessionId, setSessionId] = useState('');

  const loadMatchup = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sid = sessionId || getSessionId();
    if (!sessionId) setSessionId(sid);

    const { data: pairData, error: rpcError } = await supabase
      .rpc('next_matchup', { p_category: category, p_session_id: sid })
      .single();

    const pair = pairData as { player_a: string; player_b: string } | null;

    if (rpcError || !pair) {
      setError("Couldn't load a matchup. The player pool for this category may still be seeding.");
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
    track('vote_category_selected', { category });
    loadMatchup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function handlePick(winnerSide: 'a' | 'b') {
    if (!matchup || exiting) return;
    const winner = winnerSide === 'a' ? matchup.a : matchup.b;
    const loser = winnerSide === 'a' ? matchup.b : matchup.a;
    setExiting(winnerSide === 'a' ? 'right' : 'left');

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

    setVoteCount((n) => n + 1);
    setTimeout(() => {
      setExiting(null);
      setLoading(true);
      loadMatchup();
    }, 260);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-8 sm:py-12">
      <CategoryTabs active={category} basePath="/vote" />

      <div className="text-center">
        <h1 className="section-title">Who would you rather have?</h1>
        <p className="mt-1 text-sm text-white/50">
          {voteCount > 0 ? `${voteCount} votes this session — keep going.` : 'Tap a player to vote. Instant, no account needed.'}
        </p>
      </div>

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
      <div className="h-28 w-28 rounded-full bg-ink-700 sm:h-36 sm:w-36" />
      <div className="h-5 w-32 rounded bg-ink-700" />
      <div className="h-3 w-20 rounded bg-ink-700" />
    </div>
  );
}
