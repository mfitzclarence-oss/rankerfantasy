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
 * Renders a generic (non-trademarked) jersey silhouette tinted with the
 * player's real team colors, with their jersey number on the chest. This is
 * a stylized icon, not a reproduction of any team's actual uniform template
 * or logo — real NFL jersey artwork is licensed/trademarked, so we draw our
 * own shape instead of sourcing team imagery. Falls back to the player's
 * initials when no jersey number is on file yet (populated by the daily
 * sync job — see app/api/sync-players/route.ts).
 */
export function JerseyAvatar({ teamAbbreviation, jerseyNumber, fullName, size = 'lg' }: Props) {
  const { primary, secondary } = teamColor(teamAbbreviation);

  return (
    <div
      style={{
        boxShadow: `0 0 0 3px ${primary}, 0 0 0 5px ${secondary}`,
        backgroundImage: `linear-gradient(135deg, ${primary}33, ${secondary}33)`,
      }}
      className={clsx('relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-700', SIZE_CLASSES[size])}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M50 6 L61 6 L68 15 L83 11 L97 32 L83 45 L76 39 L76 94 L24 94 L24 39 L17 45 L3 32 L17 11 L32 15 Z"
          fill={primary}
        />
        <path
          d="M50 6 L61 6 L68 15 L61 22 L50 17 L39 22 L32 15 Z"
          fill={secondary}
          opacity="0.9"
        />
        <rect x="24" y="39" width="52" height="6" fill={secondary} opacity="0.55" />
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
