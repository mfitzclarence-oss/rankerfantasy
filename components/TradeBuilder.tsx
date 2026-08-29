'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSessionId } from '@/lib/session';
import { track } from '@/lib/analytics';
import { PlayerSearch } from '@/components/PlayerSearch';
import type { PlayerRow, LeagueSize, TradeFormat, TradeScoring } from '@/lib/database.types';

export function TradeBuilder() {
  const router = useRouter();
  const [supabase] = useState(createClient);

  const [sideA, setSideA] = useState<PlayerRow[]>([]);
  const [sideB, setSideB] = useState<PlayerRow[]>([]);
  const [format, setFormat] = useState<TradeFormat>('redraft');
  const [scoring, setScoring] = useState<TradeScoring>('half_ppr');
  const [leagueSize, setLeagueSize] = useState<LeagueSize>('12');
  const [superflex, setSuperflex] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const excludeIds = [...sideA, ...sideB].map((p) => p.id);
  const canSubmit = sideA.length > 0 && sideB.length > 0 && sideA.length <= 6 && sideB.length <= 6;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('create_trade', {
      p_session_id: getSessionId(),
      p_title: null,
      p_format: format,
      p_scoring: scoring,
      p_league_size: leagueSize,
      p_superflex: superflex,
      p_side_a: sideA.map((p) => p.id),
      p_side_b: sideB.map((p) => p.id),
    });

    if (rpcError || !data) {
      setError(rpcError?.message ?? 'Could not submit this trade — please try again.');
      setSubmitting(false);
      return;
    }

    track('trade_created', { trade_id: data as unknown as string, format, scoring });
    router.push(`/trades/${data}` as any);
    router.refresh();
  }

  return (
    <div className="card p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TradeSideBuilder label="Team A receives" players={sideA} onAdd={(p) => setSideA((s) => [...s, p])} onRemove={(id) => setSideA((s) => s.filter((p) => p.id !== id))} excludeIds={excludeIds} />
        <TradeSideBuilder label="Team B receives" players={sideB} onAdd={(p) => setSideB((s) => [...s, p])} onRemove={(id) => setSideB((s) => s.filter((p) => p.id !== id))} excludeIds={excludeIds} />
      </div>

      <div className="mt-8 border-t border-ink-700 pt-6">
        <p className="mb-3 text-sm font-semibold text-white/70">League context (optional, but it materially affects trade value)</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Select label="Format" value={format} onChange={(v) => setFormat(v as TradeFormat)} options={[['redraft', 'Redraft'], ['dynasty', 'Dynasty'], ['keeper', 'Keeper']]} />
          <Select label="Scoring" value={scoring} onChange={(v) => setScoring(v as TradeScoring)} options={[['standard', 'Standard'], ['half_ppr', 'Half PPR'], ['ppr', 'PPR']]} />
          <Select label="League Size" value={leagueSize} onChange={(v) => setLeagueSize(v as LeagueSize)} options={[['8', '8'], ['10', '10'], ['12', '12'], ['14+', '14+']]} />
          <div>
            <label className="mb-1 block text-xs font-medium text-white/40">Superflex</label>
            <button
              type="button"
              onClick={() => setSuperflex((s) => !s)}
              className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${superflex ? 'border-accent bg-accent text-white' : 'border-ink-600 bg-ink-800 text-white/60'}`}
            >
              {superflex ? 'Yes' : 'No'}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-negative">{error}</p>}

      <button
        onClick={submit}
        disabled={!canSubmit || submitting}
        className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Submitting…' : 'Submit Trade for Community Vote'}
      </button>
    </div>
  );
}

function TradeSideBuilder({
  label,
  players,
  onAdd,
  onRemove,
  excludeIds,
}: {
  label: string;
  players: PlayerRow[];
  onAdd: (p: PlayerRow) => void;
  onRemove: (id: string) => void;
  excludeIds: string[];
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-white/70">{label}</p>
      <PlayerSearch onSelect={onAdd} excludeIds={excludeIds} placeholder="Add a player…" />
      <div className="mt-3 space-y-2">
        {players.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-ink-600 bg-ink-800 px-3 py-2">
            <span className="text-sm text-white">
              {p.full_name} <span className="text-xs text-white/40">({p.position} &middot; {p.team_abbreviation})</span>
            </span>
            <button onClick={() => onRemove(p.id)} className="text-white/40 hover:text-negative">
              ✕
            </button>
          </div>
        ))}
        {players.length === 0 && <p className="text-xs text-white/30">No players added yet.</p>}
      </div>
    </div>
  );
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-white/40">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}
