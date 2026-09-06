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
    <div className="mx-auto max-w-4xl px-2.5 py-5 sm:px-6 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="hidden text-center text-[10px] font-bold uppercase tracking-[0.2em] text-accent-bright sm:block">Live Community Data</p>
      <h1 className="page-title mt-1 !text-2xl sm:!text-4xl">Community Rankings</h1>
      <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-white/50 sm:text-sm">Live ratings out of 100, grouped into clear draft tiers.</p>

      <TokenGate>
        <div className="mt-4 flex flex-col items-center gap-2.5 sm:mt-5">
          <CategoryTabs active="overall" basePath="/rankings" />
          <RankingsFilterBar />
        </div>

        <div className="mt-3 sm:mt-4">
          <RankingsTable rows={rows} />
        </div>
      </TokenGate>
    </div>
  );
}
