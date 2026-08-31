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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="max-w-xl">
          <h1 className="page-title">Trade Vote</h1>
          <p className="mt-3 text-white/50">The community judges every trade.</p>
        </div>
        <Link href="/trades/new" className="btn-primary !px-5 !py-2.5 text-sm">Submit a Trade</Link>
      </div>

      <TokenGate>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={`/trades?sort=${s.key}` as any}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
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
