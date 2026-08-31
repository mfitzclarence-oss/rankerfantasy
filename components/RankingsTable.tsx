import Link from 'next/link';
import { ratingOutOf100 } from '@/lib/ratingScore';
import { teamColor } from '@/lib/teamColors';

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
      <div>
        {rows.map((row) => {
          const displayRating = ratingOutOf100(row.rating, leaderRating, row.rank);
          const { primary, secondary } = teamColor(row.team_abbreviation);
          return (
            <Link
              key={row.player_id}
              href={`/players/${row.slug}` as any}
              style={{
                borderColor: `${secondary}aa`,
                backgroundColor: primary,
                backgroundImage: `linear-gradient(100deg, rgba(4,8,18,0.42), rgba(4,8,18,0.78)), linear-gradient(120deg, ${primary} 0%, ${primary} 82%, ${secondary} 82%, ${secondary} 100%)`,
              }}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b px-4 py-3.5 transition-[filter,transform] hover:brightness-110 active:scale-[0.995] sm:grid-cols-[1fr_5rem_6rem_5rem_7.5rem] sm:gap-2 sm:px-4"
            >
              <div className="min-w-0">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-black uppercase text-white sm:text-xl">{row.full_name}</p>
                  <div className="mt-1 flex items-center gap-2 text-white">
                    <span className="font-display text-lg font-black uppercase leading-none">{row.position}</span>
                    <span className="h-4 w-px bg-white/30" />
                    <span className="font-display text-base font-black uppercase leading-none tracking-wide sm:text-lg">{row.team_abbreviation}</span>
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-white/65 sm:hidden">{row.wins}-{row.losses} record &middot; {row.comparisons} votes</p>
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
