import Link from 'next/link';
import { ratingOutOf100 } from '@/lib/ratingScore';
import { teamColor } from '@/lib/teamColors';
import type { Category } from '@/lib/database.types';

export interface RankingRow {
  rank: number;
  player_id: string;
  slug: string;
  full_name: string;
  position: string;
  team_abbreviation: string;
  bye_week: number | null;
  rating: number;
  comparisons: number;
  wins: number;
  losses: number;
  seed_rank_overall?: number | null;
  seed_rank_position?: number | null;
  movement?: number | null; // + = moved up vs seed rank, - = moved down
  position_rank?: number | null;
  overall_rank?: number | null;
}

interface Tier {
  number: number;
  label: string;
}

const TIER_LABELS = ['Elite', 'High-end starters', 'Solid starters', 'Depth', 'Upside'] as const;

function tierForRank(rank: number, category: Category): Tier {
  const cutoffs = category === 'overall'
    ? [12, 36, 72, 120]
    : category === 'rb' || category === 'wr'
      ? [8, 18, 36, 54]
      : [4, 8, 12, 18];
  const tierIndex = cutoffs.findIndex((cutoff) => rank <= cutoff);
  const number = tierIndex === -1 ? 5 : tierIndex + 1;

  return { number, label: TIER_LABELS[number - 1] };
}

export function RankingsTable({ rows, category }: { rows: RankingRow[]; category: Category }) {
  const leaderRating = rows[0]?.rating ?? 1500;

  return (
    <div className="card overflow-hidden">
      <div className="hidden grid-cols-[1fr_4rem_5rem_4rem_6rem_6rem] gap-2 border-b border-ink-700 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white/40 sm:grid">
        <span>Player</span>
        <span className="text-right">Rating</span>
        <span className="text-right">Record</span>
        <span className="text-right">Votes</span>
        <span className="text-right">Position Ranking</span>
        <span className="text-right">Overall Ranking</span>
      </div>
      <div>
        {rows.map((row, index) => {
          const displayRating = ratingOutOf100(row.rating, leaderRating, row.rank);
          const { primary, secondary } = teamColor(row.team_abbreviation);
          const tier = tierForRank(row.rank, category);
          const previousTier = index > 0 ? tierForRank(rows[index - 1].rank, category) : null;
          const startsTier = previousTier?.number !== tier.number;

          return (
            <div key={row.player_id}>
              {startsTier ? (
                <div className="flex items-center gap-2 border-b border-accent/25 bg-ink-950/95 px-2.5 py-1.5 sm:px-3 sm:py-2">
                  <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                    Tier {tier.number}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{tier.label}</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-accent/35 to-transparent" />
                </div>
              ) : null}
              <Link
                href={`/players/${row.slug}` as any}
                style={{
                  borderColor: `${secondary}aa`,
                  backgroundColor: primary,
                  backgroundImage: `linear-gradient(100deg, rgba(4,8,18,0.42), rgba(4,8,18,0.78)), linear-gradient(120deg, ${primary} 0%, ${primary} 82%, ${secondary} 82%, ${secondary} 100%)`,
                }}
                className="grid min-h-14 grid-cols-[minmax(0,1fr)_2.5rem_4.75rem] items-center gap-1.5 border-b px-2.5 py-1.5 transition-[filter,transform] hover:brightness-110 active:scale-[0.995] sm:min-h-0 sm:grid-cols-[1fr_4rem_5rem_4rem_6rem_6rem] sm:gap-2 sm:px-3 sm:py-2"
              >
                <div className="min-w-0">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-black uppercase leading-tight text-white sm:text-base">{row.full_name}</p>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase leading-none text-white/70 sm:text-xs">
                      <span className="text-white">{row.position}</span>
                      <span className="h-3 w-px bg-white/25" />
                      <span className="text-white">{row.team_abbreviation}</span>
                      <span className="text-white/35">•</span>
                      <span className="truncate normal-case">{row.wins}-{row.losses} · {row.comparisons} vote{row.comparisons === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </div>

                <span className="text-right">
                  <span className="block font-display text-base font-bold leading-none text-accent-bright sm:text-sm">{displayRating}</span>
                  <span className="mt-0.5 block text-[8px] uppercase tracking-wide text-white/35 sm:hidden">Rating</span>
                </span>
                <span className="hidden text-right text-xs text-white/55 sm:block">
                  {row.wins}-{row.losses}
                </span>
                <span className="hidden text-right text-xs text-white/55 sm:block">{row.comparisons}</span>
                <span className="hidden text-right text-xs text-white/70 sm:block">{row.position_rank ? `#${row.position_rank}` : '—'}</span>
                <span className="text-right">
                  <span className="hidden text-xs font-bold text-white/75 sm:block">{row.overall_rank ? `#${row.overall_rank}` : '—'}</span>
                  <span className="block whitespace-nowrap text-[9px] font-bold uppercase leading-tight text-white/70 sm:hidden">Pos {row.position_rank ? `#${row.position_rank}` : '—'}</span>
                  <span className="block whitespace-nowrap text-[9px] font-bold uppercase leading-tight text-white/45 sm:hidden">Overall {row.overall_rank ? `#${row.overall_rank}` : '—'}</span>
                </span>
              </Link>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="p-8 text-center text-sm text-white/40">
            Rankings are temporarily unavailable. Please try again shortly.
          </p>
        )}
      </div>
    </div>
  );
}
