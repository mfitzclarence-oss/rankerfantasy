'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlayerSearch } from '@/components/PlayerSearch';
import { createClient } from '@/lib/supabase/client';
import { getSessionId } from '@/lib/session';
import { teamColor } from '@/lib/teamColors';
import type { LeagueSize, PlayerRow, TradeScoring } from '@/lib/database.types';

const MIN_PLAYERS = 5;
const MAX_PLAYERS = 24;

export function CommunityTeamBuilder() {
  const router = useRouter();
  const [supabase] = useState(createClient);
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [scoring, setScoring] = useState<TradeScoring>('half_ppr');
  const [leagueSize, setLeagueSize] = useState<LeagueSize>('12');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = teamName.trim().length >= 2 && players.length >= MIN_PLAYERS && players.length <= MAX_PLAYERS;

  function addPlayer(player: PlayerRow) {
    if (players.length >= MAX_PLAYERS) return;
    setPlayers((current) => [...current, player]);
  }

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc('create_community_team', {
      p_session_id: getSessionId(),
      p_team_name: teamName.trim(),
      p_scoring: scoring,
      p_league_size: leagueSize,
      p_player_ids: players.map((player) => player.id),
    });

    if (rpcError) {
      setError(rpcError.message || 'Your team could not be submitted.');
      setSubmitting(false);
      return;
    }

    router.push('/teams?submitted=1' as any);
    router.refresh();
  }

  return (
    <div className="card overflow-visible p-4 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="sm:col-span-3">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-white/55">Team name</span>
          <input
            value={teamName}
            onChange={(event) => setTeamName(event.target.value.slice(0, 50))}
            placeholder="e.g. Sunday Champions"
            className="w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-base font-bold text-white placeholder:text-white/25 focus:border-accent focus:outline-none"
          />
        </label>
        <Select
          label="Scoring"
          value={scoring}
          onChange={(value) => setScoring(value as TradeScoring)}
          options={[["ppr", "PPR"], ["half_ppr", "Half-PPR"], ["standard", "Non-PPR"]]}
        />
        <Select
          label="League size"
          value={leagueSize}
          onChange={(value) => setLeagueSize(value as LeagueSize)}
          options={[["8", "8 teams"], ["10", "10 teams"], ["12", "12 teams"], ["14+", "14+ teams"]]}
        />
        <div className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-3">
          <span className="block text-xs font-bold uppercase tracking-[0.1em] text-accent-bright">Roster</span>
          <strong className="mt-1 block text-lg text-white">{players.length} / {MAX_PLAYERS}</strong>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-white">Add your players</p>
            <p className="text-xs text-white/40">At least {MIN_PLAYERS} players. Add starters and bench.</p>
          </div>
          <span className="shrink-0 text-xs font-bold text-white/45">{Math.max(0, MIN_PLAYERS - players.length)} more required</span>
        </div>
        <PlayerSearch
          onSelect={addPlayer}
          excludeIds={players.map((player) => player.id)}
          placeholder={players.length >= MAX_PLAYERS ? 'Roster full' : 'Search and add a player…'}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {players.map((player) => {
          const colors = teamColor(player.team_abbreviation);
          return (
            <div
              key={player.id}
              className="relative min-w-0 overflow-hidden rounded-xl border p-3"
              style={{
                borderColor: colors.secondary,
                background: `linear-gradient(120deg, ${colors.primary}, ${colors.primary} 78%, ${colors.secondary} 78%)`,
              }}
            >
              <button
                type="button"
                onClick={() => setPlayers((current) => current.filter((item) => item.id !== player.id))}
                aria-label={`Remove ${player.full_name}`}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-xs text-white/70 hover:text-white"
              >
                ×
              </button>
              <p className="truncate pr-6 font-display text-sm font-black uppercase text-white">{player.full_name}</p>
              <p className="mt-1 text-[11px] font-bold text-white/75">{player.position} · {player.team_abbreviation}</p>
            </div>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-ink-600 p-6 text-center text-sm text-white/35">
          Your roster will appear here.
        </div>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-negative">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit || submitting}
        className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Submitting…' : 'Put My Team Up for Rating'}
      </button>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-white/55">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-sm font-bold text-white focus:border-accent focus:outline-none"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}
