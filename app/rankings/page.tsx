import type { Metadata } from 'next';
import { CategoryTabs } from '@/components/CategoryTabs';
import { RankingsFilterBar } from '@/components/RankingsFilterBar';
import { RankingsTable } from '@/components/RankingsTable';
import { TokenGate } from '@/components/TokenGate';
import { fetchRankings } from '@/lib/rankings';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Fantasy Football Rankings 2026',
  description: 'Live, crowd-sourced overall fantasy football rankings for 2026, built entirely from head-to-head community votes.',
  alternates: { canonical: '/rankings' },
};

export default async function RankingsPage({ searchParams }: { searchParams: { limit?: string } }) {
  const limit = searchParams.limit === 'all' ? 300 : searchParams.limit === '25' ? 25 : 50;
  const rows = await fetchRankings('overall', limit);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '2026 Fantasy Football Overall Rankings',
    itemListElement: rows.slice(0, 25).map((r) => ({
      '@type': 'ListItem',
      position: r.rank,
      name: r.full_name,
      url: `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.rankupfantasy.com').replace(/\/$/, '')}/players/${r.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-accent-bright sm:text-left">Live Community Data</p>
      <h1 className="page-title mt-2">Community Rankings</h1>
      <p className="mt-2 text-center text-white/50 sm:text-left">Started from current ESPN PPR ADP and updated by every community vote.</p>

      <TokenGate>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CategoryTabs active="overall" basePath="/rankings" />
          <RankingsFilterBar />
        </div>

        <div className="mt-6">
          <RankingsTable rows={rows} />
        </div>
      </TokenGate>
    </div>
  );
}
