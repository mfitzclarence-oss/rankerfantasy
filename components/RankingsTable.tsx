import Link from 'next/link';
import { byeLabel } from '@/lib/format';
import { ratingOutOf100 } from '@/lib/ratingScore';

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
}

export function RankingsTable({ rows, rankingLabel = 'Overall Ranking' }: { rows: RankingRow[]; rankingLabel?: string }) {
  const leaderRating = rows[0]?.rating ?? 1500;

  return (
    <div className="card overflow-hidden">
      <div className="hidden grid-cols-[1fr_5rem_6rem_5rem_7.5rem] gap-2 border-b border-ink-700 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/35 sm:grid">
        <span>Player</span>
        <span className="text-right">Rating</span>
        <span className="text-right">Record</span>
        <span className="text-right">Votes</span>
        <span className="text-right">{rankingLabel}</span>
      </div>
      <div className="divide-y divide-ink-700/70">
        {rows.map((row) => {
          const displayRating = ratingOutOf100(row.rating, leaderRating, row.rank);
          return (
            <Link
              key={row.player_id}
              href={`/players/${row.slug}` as any}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-800/60 sm:grid-cols-[1fr_5rem_6rem_5rem_7.5rem] sm:gap-2 sm:px-4"
            >
              <div className="min-w-0">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-black uppercase text-white sm:text-xl">{row.full_name}</p>
                  <p className="text-xs text-white/40">
                    {row.position} &middot; {row.team_abbreviation} &middot; {byeLabel(row.bye_week)}
                    <span className="sm:hidden"> &middot; {row.wins}-{row.losses} &middot; {row.comparisons} votes</span>
                  </p>
                </div>
              </div>

              <span className="text-right">
                <span className="block font-display text-lg font-bold text-accent-bright">{displayRating}</span>
                <span className="block text-[10px] uppercase tracking-wide text-white/30 sm:hidden">Rating</span>
              </span>
              <span className="hidden text-right text-sm text-white/50 sm:block">
                {row.wins}-{row.losses}
              </span>
              <span className="hidden text-right text-sm text-white/50 sm:block">{row.comparisons}</span>
              <span className="text-right">
                <span className="block font-display text-base font-bold text-white/65">#{row.rank}</span>
                <span className="block text-[10px] uppercase tracking-wide text-white/30 sm:hidden">Rank</span>
              </span>
            </Link>
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
