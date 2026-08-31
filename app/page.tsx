import Link from 'next/link';
import { VoteArena } from '@/components/VoteArena';
import { OrderUpPromo } from '@/components/OrderUpPromo';
import { byeLabel } from '@/lib/format';
import { fetchRankings } from '@/lib/rankings';

export const revalidate = 60;

async function getTopOverall() {
  return fetchRankings('overall', 6);
}

export default async function HomePage() {
  const top = await getTopOverall();

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_700px_560px_at_82%_28%,rgba(47,125,244,0.13),transparent_68%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-5 flex items-center justify-center gap-3 text-xs font-extrabold uppercase tracking-[0.12em] text-blue before:h-0.5 before:w-7 before:bg-accent after:h-0.5 after:w-7 after:bg-accent">Community-powered fantasy rankings</p>
            <h1 className="mx-auto max-w-4xl text-balance font-display text-[2.8rem] font-black leading-[0.98] tracking-[-0.055em] text-white sm:text-7xl">
              The rankings start <span className="block text-blue">with your vote.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-white/65 sm:text-xl">
              <strong className="text-white">Pick who you would rather draft.</strong> Every head-to-head choice builds live rankings shaped by fantasy players—not experts.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 min-[420px]:flex-row">
            <Link href="/vote" className="btn-primary">Start Voting</Link>
            <Link href="/rankings" className="btn-secondary">View Rankings</Link>
          </div>
          <p className="mt-5 text-xs font-semibold leading-relaxed text-white/45">No account needed <span className="mx-2 text-blue">•</span> One tap per vote <span className="mx-2 text-blue">•</span> Rankings update live</p>
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl pb-16 pt-4">
          <VoteArena category="qb" redirectOnLoad={false} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6 text-center">
          <div>
            <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">Live Community Rankings</h2>
            <p className="mt-1.5 text-sm text-white/50">Updated with every vote. Overall, skill positions only.</p>
          </div>
        </div>

        <div className="card divide-y divide-ink-700 overflow-hidden">
          {top.length === 0 && (
            <p className="p-6 text-sm text-white/40">
              Community rankings are temporarily unavailable. Please try again shortly.
            </p>
          )}
          {top.map((row, i) => (
            <div key={row.player_id} className="flex items-center gap-4 px-4 py-3 sm:px-6">
              <span className="w-6 shrink-0 text-center font-display text-lg font-bold text-white/30">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-black uppercase text-white sm:text-xl">{row.full_name}</p>
                <p className="text-xs text-white/40">
                  {row.position} &middot; {row.team_abbreviation} &middot; {byeLabel(row.bye_week)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-accent-bright">{Math.round(row.rating)}</p>
                <p className="text-[11px] text-white/30">{row.comparisons} votes</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/rankings" className="mt-5 block text-center text-sm font-semibold text-accent-bright hover:underline">
          View full rankings →
        </Link>
      </section>

      <section className="mx-3 rounded-[1.75rem] border border-ink-700 bg-ink-900/55 py-16 sm:mx-5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-6 text-center font-display text-3xl font-black tracking-tight text-white sm:text-4xl">Vote by Position</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {[
              ['QB', 'qb'], ['RB', 'rb'], ['WR', 'wr'], ['TE', 'te'], ['K', 'k'], ['D/ST', 'dst'],
            ].map(([label, slug]) => (
              <Link
                key={slug}
                href={`/vote/${slug}` as any}
                className="card flex flex-col items-center gap-2 p-5 text-center transition-colors hover:border-accent/50"
              >
                <span className="font-display text-2xl font-black text-white">{label}</span>
                <span className="text-xs text-white/40">Vote now →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <OrderUpPromo />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="card grid grid-cols-1 items-center gap-8 overflow-hidden p-6 sm:grid-cols-2 sm:p-12">
          <div className="text-center">
            <span className="pill mb-4">New: Trade Vote</span>
            <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">Let the community judge your trade.</h2>
            <p className="mt-3 text-white/60">
              Submit any trade — 1-for-1 up to larger multi-player deals — and get a real-time read from other
              fantasy managers: Team A Wins, Fair Trade, or Team B Wins.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 min-[420px]:flex-row">
              <Link href="/trades/new" className="btn-primary">Submit a Trade</Link>
              <Link href="/trades" className="btn-secondary">Browse Trades</Link>
            </div>
          </div>
          <TradePreviewCard />
        </div>
      </section>

    </div>
  );
}

function TradePreviewCard() {
  return (
    <div className="card bg-ink-800/60 p-5">
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>Dynasty &middot; PPR &middot; 12-team</span>
        <span>142 votes</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-2 font-semibold text-white/70">Team A gets</p>
          <p className="text-white">Jahmyr Gibbs</p>
        </div>
        <div>
          <p className="mb-2 font-semibold text-white/70">Team B gets</p>
          <p className="text-white">Puka Nacua</p>
          <p className="text-white">James Cook III</p>
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-700">
        <div className="flex h-full">
          <div className="h-full bg-accent" style={{ width: '47%' }} />
          <div className="h-full bg-white/20" style={{ width: '18%' }} />
          <div className="h-full bg-positive" style={{ width: '35%' }} />
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-white/40">
        <span>Team A 47%</span>
        <span>Fair 18%</span>
        <span>Team B 35%</span>
      </div>
    </div>
  );
}
