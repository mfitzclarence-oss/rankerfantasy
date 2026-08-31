'use client';

import clsx from 'clsx';
import type { PlayerRow, PlayerRatingRow } from '@/lib/database.types';
import { byeLabel } from '@/lib/format';
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
      style={{
        borderColor: secondary,
        backgroundColor: primary,
        backgroundImage: `linear-gradient(145deg, rgba(4, 8, 18, 0.38), rgba(4, 8, 18, 0.78)), linear-gradient(125deg, ${primary} 0%, ${primary} 68%, ${secondary} 68%, ${secondary} 100%)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.16), 0 14px 38px ${primary}33`,
      }}
      className={clsx(
        'group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 text-center transition-transform',
        size === 'lg' ? 'min-h-[190px] gap-3 p-5 sm:min-h-[270px] sm:gap-5 sm:p-8' : 'min-h-[150px] gap-2 p-4',
        !disabled && 'hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.97]',
        exiting === 'left' && 'animate-slide-out-left',
        exiting === 'right' && 'animate-slide-out-right'
      )}
    >
      <div aria-hidden className="pointer-events-none absolute -right-4 -top-7 font-display text-[8rem] font-black leading-none text-white/[0.06] sm:text-[12rem]">
        {player.position}
      </div>

      <div className="relative min-w-0">
        <p className={clsx('text-balance font-display font-black uppercase leading-[0.95] text-white', size === 'lg' ? 'text-4xl sm:text-5xl' : 'text-xl sm:text-2xl')}>
          {player.full_name}
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-center gap-x-4 gap-y-2 text-white sm:mt-6">
          <span className={clsx('font-display font-black uppercase leading-[0.75] drop-shadow-lg', size === 'lg' ? 'text-6xl sm:text-8xl' : 'text-4xl')}>
            {player.position}
          </span>
          <span className="flex flex-col items-start text-left">
            <span className={clsx('font-display font-black uppercase leading-none tracking-wide', size === 'lg' ? 'text-2xl sm:text-4xl' : 'text-xl')}>
              {player.team_abbreviation}
            </span>
            <span className="mt-1 text-xs font-bold uppercase tracking-wider text-white/70 sm:text-sm">{byeLabel(player.bye_week)}</span>
          </span>
          {player.injury_status && (
            <span className="pill !border-white/30 !bg-black/25 !text-white">
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
