'use client';

import clsx from 'clsx';
import type { PlayerRow, PlayerRatingRow } from '@/lib/database.types';
import { byeLabel } from '@/lib/format';
import { teamColor } from '@/lib/teamColors';
import { JerseyAvatar } from '@/components/JerseyAvatar';

interface Props {
  player: PlayerRow;
  rating?: PlayerRatingRow | null;
  rank?: number | null;
  onClick?: () => void;
  disabled?: boolean;
  exiting?: 'left' | 'right' | null;
  size?: 'lg' | 'md';
}

export function PlayerCard({ player, rating, rank, onClick, disabled, exiting, size = 'lg' }: Props) {
  const { primary } = teamColor(player.team_abbreviation);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ borderTopColor: primary }}
      className={clsx(
        'card group relative flex w-full flex-col items-center overflow-hidden border-t-[3px] text-center transition-transform',
        size === 'lg' ? 'gap-2 p-3 sm:gap-4 sm:p-8' : 'gap-2 p-3',
        !disabled && 'hover:-translate-y-0.5 hover:border-t-[3px] active:scale-[0.97]',
        exiting === 'left' && 'animate-slide-out-left',
        exiting === 'right' && 'animate-slide-out-right'
      )}
    >
      <JerseyAvatar
        teamAbbreviation={player.team_abbreviation}
        jerseyNumber={player.jersey_number}
        fullName={player.full_name}
        size={size === 'lg' ? 'lg' : 'sm'}
      />

      <div className="min-w-0">
        <p className={clsx('text-balance font-display font-black uppercase leading-none text-white', size === 'lg' ? 'text-2xl sm:text-4xl' : 'text-base')}>
          {player.full_name}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-xs text-white/50">
          <span
            className="pill"
            style={{ backgroundColor: `${primary}26`, borderColor: `${primary}80`, color: '#fff' }}
          >
            {player.position}
          </span>
          <span>{player.team_abbreviation}</span>
          <span className="text-white/30">&middot;</span>
          <span>{byeLabel(player.bye_week)}</span>
          {player.injury_status && (
            <span className="pill !border-negative/50 !bg-negative/15 !text-negative">
              {player.injury_status}
            </span>
          )}
        </div>
      </div>

      {typeof rank === 'number' && rank > 0 && (
        <span className="pill !bg-accent/15 !border-accent/40 !text-accent-bright">
          Community Rank #{rank}
        </span>
      )}
      {rating && size === 'lg' && (
        <span className="text-[11px] uppercase tracking-wide text-white/30">
          {rating.comparisons.toLocaleString()} votes cast
        </span>
      )}
    </button>
  );
}
