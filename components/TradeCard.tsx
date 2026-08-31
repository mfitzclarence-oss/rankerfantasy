'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';
import { getSessionId } from '@/lib/session';
import { track } from '@/lib/analytics';
import type { TradeVoteChoice } from '@/lib/database.types';

export interface TradeCardData {
  id: string;
  title: string | null;
  format: string;
  scoring: string;
  league_size: string;
  superflex: boolean;
  created_at: string;
  sideA: { full_name: string; position: string }[];
  sideB: { full_name: string; position: string }[];
  votes: { team_a: number; fair: number; team_b: number };
  userVote?: TradeVoteChoice | null;
}

const SCORING_LABEL: Record<string, string> = { standard: 'Standard', half_ppr: 'Half PPR', ppr: 'PPR' };
const FORMAT_LABEL: Record<string, string> = { redraft: 'Redraft', dynasty: 'Dynasty', keeper: 'Keeper' };

export function TradeCard({ trade, linkToDetail = true }: { trade: TradeCardData; linkToDetail?: boolean }) {
  const [supabase] = useState(createClient);
  const [votes, setVotes] = useState(trade.votes);
  const [myVote, setMyVote] = useState<TradeVoteChoice | null | undefined>(trade.userVote);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const total = votes.team_a + votes.fair + votes.team_b;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('trade_votes')
      .select('vote')
      .eq('trade_id', trade.id)
      .eq('session_id', getSessionId())
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setMyVote((data?.vote as TradeVoteChoice | undefined) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, trade.id]);

  async function vote(choice: TradeVoteChoice) {
    if (voting || myVote === choice) return;
    const previous = myVote;
    const previousVotes = votes;
    setVoting(true);
    setVoteError(null);
    setMyVote(choice);
    setVotes((v) => {
      const next = { ...v };
      if (previous) next[previous] = Math.max(0, next[previous] - 1);
      next[choice] += 1;
      return next;
    });
    track('trade_vote', { trade_id: trade.id, vote: choice });
    const { error } = await supabase.rpc('cast_trade_vote', {
      p_trade_id: trade.id,
      p_session_id: getSessionId(),
      p_vote: choice,
    });
    setVoting(false);
    if (error) {
      setMyVote(previous);
      setVotes(previousVotes);
      setVoteError(error.message || 'Your vote could not be saved.');
    }
  }

  async function share() {
    const url = `${window.location.origin}/trades/${trade.id}`;
    const canShare = typeof navigator.share === 'function';
    track('trade_shared', { trade_id: trade.id, method: canShare ? 'native' : 'clipboard' });
    if (canShare) {
      try {
        await navigator.share({ url, title: 'Fantasy trade — RankUp Fantasy' });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
        <div className="flex flex-wrap gap-1.5">
          <span className="pill">{FORMAT_LABEL[trade.format]}</span>
          <span className="pill">{SCORING_LABEL[trade.scoring]}</span>
          <span className="pill">{trade.league_size}-team</span>
          {trade.superflex && <span className="pill">Superflex</span>}
        </div>
        <span>{total} votes</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <TradeSide label="Team A receives" players={trade.sideA} />
        <TradeSide label="Team B receives" players={trade.sideB} />
      </div>

      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-ink-700">
        <div className="h-full bg-accent" style={{ width: `${pct(votes.team_a)}%` }} />
        <div className="h-full bg-white/25" style={{ width: `${pct(votes.fair)}%` }} />
        <div className="h-full bg-positive" style={{ width: `${pct(votes.team_b)}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-white/40">
        <span>Team A {pct(votes.team_a)}%</span>
        <span>Fair {pct(votes.fair)}%</span>
        <span>Team B {pct(votes.team_b)}%</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <VoteButton label="Team A Wins" active={myVote === 'team_a'} disabled={voting} onClick={() => vote('team_a')} />
        <VoteButton label="Fair Trade" active={myVote === 'fair'} disabled={voting} onClick={() => vote('fair')} />
        <VoteButton label="Team B Wins" active={myVote === 'team_b'} disabled={voting} onClick={() => vote('team_b')} />
      </div>
      {voteError && <p className="mt-2 text-xs text-negative">{voteError}</p>}

      <div className="mt-3 flex items-center justify-between">
        {linkToDetail ? (
          <Link href={`/trades/${trade.id}` as any} className="text-xs font-semibold text-accent-bright hover:underline">
            View discussion →
          </Link>
        ) : (
          <span />
        )}
        <button onClick={share} className="text-xs font-semibold text-white/40 hover:text-white/70">
          Share
        </button>
      </div>
    </div>
  );
}

function TradeSide({ label, players }: { label: string; players: { full_name: string; position: string }[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">{label}</p>
      <div className="space-y-1">
        {players.map((p, i) => (
          <p key={i} className="text-white">
            {p.full_name} <span className="text-xs text-white/35">({p.position})</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function VoteButton({ label, active, disabled, onClick }: { label: string; active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'rounded-lg border px-2 py-2 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60',
        active ? 'border-accent bg-accent text-white' : 'border-ink-600 bg-ink-800 text-white/60 hover:text-white'
      )}
    >
      {label}
    </button>
  );
}
