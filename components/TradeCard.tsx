'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';
import { getSessionId } from '@/lib/session';
import { track } from '@/lib/analytics';
import type { TradeVoteChoice } from '@/lib/database.types';
import { teamColor } from '@/lib/teamColors';

type TradePlayer = { full_name: string; position: string; team_abbreviation: string };

export interface TradeCardData {
  id: string;
  title: string | null;
  format: string;
  scoring: string;
  league_size: string;
  superflex: boolean;
  created_at: string;
  sideA: TradePlayer[];
  sideB: TradePlayer[];
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
    <article className="card group relative overflow-hidden p-4 shadow-[0_18px_55px_-30px_rgba(47,125,244,0.6)] sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
        <div className="flex flex-wrap gap-1.5">
          <span className="pill">{FORMAT_LABEL[trade.format]}</span>
          <span className="pill">{SCORING_LABEL[trade.scoring]}</span>
          <span className="pill">{trade.league_size}-team</span>
          {trade.superflex && <span className="pill">Superflex</span>}
        </div>
        <span className="font-bold text-white/55">{total} {total === 1 ? 'vote' : 'votes'}</span>
      </div>

      {trade.title && <h2 className="mt-4 text-center font-display text-xl font-black text-white sm:text-2xl">{trade.title}</h2>}

      <div className="mt-5 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-4">
        <TradeSide side="A" label="Team A gets" players={trade.sideA} />
        <div className="relative z-10 -my-5 flex items-center justify-center sm:my-0 sm:-mx-7">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-ink-900 bg-white font-display text-sm font-black italic text-ink-950 shadow-xl">VS</span>
        </div>
        <TradeSide side="B" label="Team B gets" players={trade.sideB} />
      </div>

      <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/20 p-3">
        <p className="mb-2 text-center text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/35">Community verdict</p>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-ink-700">
          <div className="h-full bg-accent transition-[width]" style={{ width: `${pct(votes.team_a)}%` }} />
          <div className="h-full bg-white/35 transition-[width]" style={{ width: `${pct(votes.fair)}%` }} />
          <div className="h-full bg-positive transition-[width]" style={{ width: `${pct(votes.team_b)}%` }} />
        </div>
        <div className="mt-2 grid grid-cols-3 text-[11px] font-bold">
          <span className="text-accent-bright">A · {pct(votes.team_a)}%</span>
          <span className="text-center text-white/55">Fair · {pct(votes.fair)}%</span>
          <span className="text-right text-positive">B · {pct(votes.team_b)}%</span>
        </div>
      </div>

      <p className="mt-5 text-center text-xs font-extrabold uppercase tracking-[0.16em] text-white/65">Cast your vote</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <VoteButton label="A Wins" choice="team_a" active={myVote === 'team_a'} disabled={voting} onClick={() => vote('team_a')} />
        <VoteButton label="Fair" choice="fair" active={myVote === 'fair'} disabled={voting} onClick={() => vote('fair')} />
        <VoteButton label="B Wins" choice="team_b" active={myVote === 'team_b'} disabled={voting} onClick={() => vote('team_b')} />
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
    </article>
  );
}

function TradeSide({ side, label, players }: { side: 'A' | 'B'; label: string; players: TradePlayer[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 sm:p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={clsx('flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black text-white', side === 'A' ? 'bg-accent' : 'bg-positive')}>{side}</span>
        <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-white/70">{label}</h3>
      </div>
      <div className="space-y-2">
        {players.map((p, i) => (
          <TradePlayerCard key={`${p.full_name}-${i}`} player={p} />
        ))}
      </div>
    </section>
  );
}

function TradePlayerCard({ player }: { player: TradePlayer }) {
  const { primary, secondary } = teamColor(player.team_abbreviation);

  return (
    <div
      className="relative min-h-24 overflow-hidden rounded-xl border p-3 shadow-lg sm:min-h-28 sm:p-4"
      style={{
        borderColor: secondary,
        backgroundColor: primary,
        backgroundImage: `linear-gradient(125deg, rgba(4,8,18,0.28), rgba(4,8,18,0.82)), linear-gradient(115deg, ${primary} 0%, ${primary} 72%, ${secondary} 72%)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.14), 0 12px 30px ${primary}28`,
      }}
    >
      <span aria-hidden="true" className="absolute -right-1 -top-4 font-display text-7xl font-black leading-none text-white/[0.08]">{player.position}</span>
      <p className="relative text-balance font-display text-xl font-black uppercase leading-[0.95] text-white sm:text-2xl">{player.full_name}</p>
      <div className="relative mt-3 flex items-center gap-2">
        <span className="rounded-md bg-black/30 px-2 py-1 text-sm font-black text-white">{player.position}</span>
        <span className="text-sm font-extrabold uppercase tracking-wide text-white/80">{player.team_abbreviation || 'FA'}</span>
      </div>
    </div>
  );
}

function VoteButton({ label, choice, active, disabled, onClick }: { label: string; choice: TradeVoteChoice; active: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'min-h-12 rounded-xl border px-2 py-2 text-xs font-extrabold transition-all disabled:cursor-wait disabled:opacity-60 sm:text-sm',
        active && choice === 'team_a' && 'border-accent bg-accent text-white shadow-[0_8px_24px_-12px_rgba(47,125,244,1)]',
        active && choice === 'fair' && 'border-white/70 bg-white text-ink-950',
        active && choice === 'team_b' && 'border-positive bg-positive text-ink-950 shadow-[0_8px_24px_-12px_rgba(59,211,154,1)]',
        !active && 'border-ink-600 bg-ink-800 text-white/65 hover:-translate-y-0.5 hover:border-white/30 hover:text-white active:translate-y-0'
      )}
    >
      <span aria-hidden="true" className="mr-1">{choice === 'team_a' ? '←' : choice === 'team_b' ? '→' : '⚖'}</span>
      {label}
    </button>
  );
}
