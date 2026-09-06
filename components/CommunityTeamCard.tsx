'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase/client';
import { getSessionId } from '@/lib/session';
import { teamColor } from '@/lib/teamColors';

type TeamPlayer = {
  id: string;
  full_name: string;
  position: string;
  team_abbreviation: string;
};

export interface CommunityTeamCardData {
  id: string;
  teamName: string;
  scoring: string;
  leagueSize: string;
  createdAt: string;
  players: TeamPlayer[];
  averageScore: number;
  ratingCount: number;
}

const SCORING_LABEL: Record<string, string> = {
  standard: 'Non-PPR',
  half_ppr: 'Half-PPR',
  ppr: 'PPR',
};

export function CommunityTeamCard({ team }: { team: CommunityTeamCardData }) {
  const [supabase] = useState(createClient);
  const [averageScore, setAverageScore] = useState(team.averageScore);
  const [ratingCount, setRatingCount] = useState(team.ratingCount);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('get_my_community_team_rating', {
        p_team_id: team.id,
        p_session_id: getSessionId(),
      })
      .then(({ data }) => {
        const score = Number(data);
        if (!cancelled && Number.isInteger(score) && score >= 1 && score <= 10) setMyScore(score);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, team.id]);

  async function rate(score: number) {
    if (voting || score === myScore) return;
    const previous = myScore;
    setMyScore(score);
    setVoting(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc('cast_community_team_rating', {
      p_team_id: team.id,
      p_session_id: getSessionId(),
      p_score: score,
    });

    if (rpcError) {
      setMyScore(previous);
      setError(rpcError.message || 'Your rating could not be saved.');
    } else if (Array.isArray(data) && data[0]) {
      setAverageScore(Number(data[0].average_score));
      setRatingCount(Number(data[0].rating_count));
    }
    setVoting(false);
  }

  return (
    <article className="card overflow-hidden p-4 [content-visibility:auto] [contain-intrinsic-size:auto_440px] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="pill">{SCORING_LABEL[team.scoring] ?? team.scoring}</span>
            <span className="pill">{team.leagueSize}-team</span>
            <span className="pill">{team.players.length} players</span>
          </div>
          <h2 className="truncate font-display text-xl font-black uppercase text-white sm:text-2xl">{team.teamName}</h2>
        </div>
        <div className="shrink-0 rounded-2xl border border-accent/30 bg-accent/10 px-3 py-2 text-center">
          <strong className="block font-display text-2xl font-black leading-none text-accent-bright">
            {ratingCount ? averageScore.toFixed(1) : '—'}
          </strong>
          <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-white/45">out of 10</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
        {team.players.map((player) => {
          const colors = teamColor(player.team_abbreviation);
          return (
            <div
              key={player.id}
              className="relative min-w-0 overflow-hidden rounded-lg border px-2.5 py-2"
              style={{
                borderColor: colors.secondary,
                background: `linear-gradient(120deg, rgba(4,8,18,.18), rgba(4,8,18,.6)), linear-gradient(120deg, ${colors.primary}, ${colors.primary} 80%, ${colors.secondary} 80%)`,
              }}
            >
              <p className="truncate font-display text-xs font-black uppercase text-white sm:text-sm">{player.full_name}</p>
              <p className="mt-0.5 text-[10px] font-bold text-white/70">{player.position} · {player.team_abbreviation}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-white/65">
            {myScore ? `Your rating: ${myScore}/10` : 'Rate this team'}
          </p>
          <span className="text-[11px] font-bold text-white/35">{ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}</span>
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
            <button
              key={score}
              type="button"
              disabled={voting}
              onClick={() => rate(score)}
              aria-label={`Rate ${team.teamName} ${score} out of 10`}
              className={clsx(
                'aspect-square rounded-lg border text-xs font-black transition-colors disabled:cursor-wait sm:text-sm',
                myScore === score
                  ? 'border-accent bg-accent text-white'
                  : 'border-ink-600 bg-ink-800 text-white/60 hover:border-accent hover:text-white'
              )}
            >
              {score}
            </button>
          ))}
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-negative">{error}</p>}
      </div>
    </article>
  );
}
