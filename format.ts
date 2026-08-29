import type { Position } from '@/lib/database.types';

export const POSITION_LABEL: Record<Position, string> = {
  QB: 'Quarterback', RB: 'Running Back', WR: 'Wide Receiver',
  TE: 'Tight End', K: 'Kicker', DST: 'Defense / Special Teams',
};

export const CATEGORY_LABEL: Record<string, string> = {
  overall: 'Overall', qb: 'QB', rb: 'RB', wr: 'WR', te: 'TE', k: 'K', dst: 'D/ST',
};

export const CATEGORIES = ['overall', 'qb', 'rb', 'wr', 'te', 'k', 'dst'] as const;

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function formatRating(rating: number): string {
  return Math.round(rating).toLocaleString();
}

export function byeLabel(bye: number | null): string {
  return bye ? `Bye ${bye}` : '—';
}

export function winPercentageLabel(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return '—';
  return `${Math.round((wins / total) * 1000) / 10}%`;
}
