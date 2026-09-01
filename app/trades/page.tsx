import type { Metadata } from 'next';
import Link from 'next/link';
import { TradeCard } from '@/components/TradeCard';
import { TokenGate } from '@/components/TokenGate';
import { fetchTradeFeed, type TradeSort } from '@/lib/trades';

export const revalidate = 15;

export const metadata: Metadata = {
  title: 'Trade Vote — Fantasy Football Trade Feed',
  description: 'Browse fantasy football trades submitted by the community and vote: Team A Wins, Fair Trade, or Team B Wins.',
};

const SORTS: { key: TradeSort; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Most Voted' },
  { key: 'controversial', label: 'Most Controversial' },
];

export default async function TradesPage({ searchParams }: { searchParams: { sort?: string } }) {
  const sort = (SORTS.find((s) => s.key === searchParams.sort)?.key ?? 'new') as TradeSort;
  const trades = await fetchTradeFeed(sort);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-[radial-gradient(circle_at_top,rgba(47,125,244,0.22),transparent_58%)] px-5 py-9 text-center sm:px-10 sm:py-12">
        <div aria-hidden="true" className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-16 bottom-0 h-40 w-40 rounded-full bg-positive/10 blur-3xl" />
        <div className="mx-auto max-w-xl">
          <span className="pill mb-4 !border-accent/30 !bg-accent/10 !text-accent-bright">Community Trade Room</span>
          <h1 className="page-title">Who won the deal?</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/60 sm:text-base">
            Compare both sides, make the call and see whether the fantasy community agrees.
          </p>
        </div>
        <Link href="/trades/new" className="btn-primary relative mt-6 !px-6 !py-3 text-sm">+ Submit Your Trade</Link>
      </div>

      <TokenGate>
        <div className="mt-7 flex gap-2 overflow-x-auto pb-1 sm:justify-center">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={`/trades?sort=${s.key}` as any}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                sort === s.key ? 'border-accent bg-accent text-white' : 'border-ink-600 bg-ink-800/60 text-white/60 hover:text-white'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {trades.length === 0 && (
            <div className="card p-8 text-center text-white/50">
              No trades yet — be the first to <Link href="/trades/new" className="text-accent-bright hover:underline">submit one</Link>.
            </div>
          )}
          {trades.map((t) => (
            <TradeCard key={t.id} trade={t} />
          ))}
        </div>
      </TokenGate>
    </div>
  );
}
