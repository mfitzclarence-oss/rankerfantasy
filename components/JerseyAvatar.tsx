import clsx from 'clsx';
import { teamColor } from '@/lib/teamColors';
import { initials } from '@/lib/format';

interface Props {
  teamAbbreviation: string;
  jerseyNumber?: number | null;
  fullName: string;
  size?: 'lg' | 'md' | 'sm' | 'xs';
}

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  lg: 'h-28 w-28 sm:h-36 sm:w-36',
  md: 'h-24 w-24',
  sm: 'h-12 w-12',
  xs: 'h-9 w-9',
};

const NUMBER_TEXT_CLASSES: Record<NonNullable<Props['size']>, string> = {
  lg: 'text-4xl sm:text-5xl',
  md: 'text-3xl',
  sm: 'text-sm',
  xs: 'text-[11px]',
};

const FALLBACK_TEXT_CLASSES: Record<NonNullable<Props['size']>, string> = {
  lg: 'text-2xl sm:text-3xl',
  md: 'text-xl',
  sm: 'text-[10px]',
  xs: 'text-[8px]',
};

/**
 * Renders a generic (non-trademarked) jersey icon — V-neck collar, short
 * sleeves with cuff trim, dark outline — tinted with the player's real team
 * colors, with their jersey number on the chest. This is a stylized icon,
 * not a reproduction of any team's actual uniform template or logo — real
 * NFL jersey artwork is licensed/trademarked, so we draw our own shape
 * instead of sourcing team imagery. Falls back to the player's initials
 * when no jersey number is on file yet (populated by the daily sync job —
 * see app/api/sync-players/route.ts).
 */
export function JerseyAvatar({ teamAbbreviation, jerseyNumber, fullName, size = 'lg' }: Props) {
  const { primary, secondary } = teamColor(teamAbbreviation);

  return (
    <div
      style={{
        backgroundImage: `linear-gradient(135deg, ${primary}33, ${secondary}33)`,
      }}
      className={clsx('relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-700', SIZE_CLASSES[size])}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M50 21 L40 9 C34 9 28 12 25 17 L14 14 C6 17 2 25 3 33 C4 39 8 43 13 42 L23 37 C25 35 27 35 29 37 L29 91 C29 95 32 98 36 98 L64 98 C68 98 71 95 71 91 L71 37 C73 35 75 35 77 37 L87 42 C92 43 96 39 97 33 C98 25 94 17 86 14 L75 17 C72 12 66 9 60 9 Z"
          fill={primary}
          stroke="#14161a"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M40 9 L50 21 L60 9 L57 13 L50 25 L43 13 Z" fill={secondary} />
        <path d="M13 42 L23 37" stroke={secondary} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M87 42 L77 37" stroke={secondary} strokeWidth="4.5" strokeLinecap="round" />
      </svg>

      {jerseyNumber ? (
        <span
          className={clsx('relative font-display font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]', NUMBER_TEXT_CLASSES[size])}
        >
          {jerseyNumber}
        </span>
      ) : (
        <span className={clsx('relative font-display font-bold text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]', FALLBACK_TEXT_CLASSES[size])}>
          {initials(fullName)}
        </span>
      )}
    </div>
  );
}
