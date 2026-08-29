'use client';

import Image from 'next/image';
import clsx from 'clsx';
import type { PlayerRow, PlayerRatingRow } from '@/lib/database.types';
import { initials, byeLabel } from '@/lib/format';
import { teamColor } from '@/lib/teamColors';

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
  const { primary, secondary } = teamColor(player.team_abbreviation);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ borderTopColor: primary }}
      className={clsx(
        'card group relative flex w-full flex-col items-center overflow-hidden border-t-[3px] text-center transition-transform',
        size === 'lg' ? 'gap-4 p-6 sm:p-8' : 'gap-2 p-3',
        !disabled && 'hover:-translate-y-0.5 hover:border-t-[3px] active:scale-[0.97]',
        exiting === 'left' && 'animate-slide-out-left',
        exiting === 'right' && 'animate-slide-out-right'
      )}
    >
      <div
        style={{
          boxShadow: `0 0 0 3px ${primary}, 0 0 0 5px ${secondary}`,
          backgroundImage: `linear-gradient(135deg, ${primary}33, ${secondary}33)`,
        }}
        className={clsx(
          'relative flex items-center justify-center overflow-hidden rounded-full bg-ink-700',
          size === 'lg' ? 'h-28 w-28 sm:h-36 sm:w-36' : 'h-12 w-12'
        )}
      >
        {player.headshot_url ? (
          <Image src={player.headshot_url} alt={player.full_name} fill sizes="150px" className="object-cover" />
        ) : (
          <span className={clsx('font-display font-bold text-white/70', size === 'lg' ? 'text-3xl' : 'text-sm')}>
            {initials(player.full_name)}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className={clsx('truncate font-display font-bold text-white', size === 'lg' ? 'text-xl sm:text-2xl' : 'text-sm')}>
          {player.full_name}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-xs text-white/50">
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
