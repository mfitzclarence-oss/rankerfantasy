import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryTabs } from '@/components/CategoryTabs';
import { RankingsFilterBar } from '@/components/RankingsFilterBar';
import { RankingsTable } from '@/components/RankingsTable';
import { TokenGate } from '@/components/TokenGate';
import { fetchRankings } from '@/lib/rankings';
import { CATEGORIES, CATEGORY_LABEL, isActiveCategory } from '@/lib/format';
import type { Category } from '@/lib/database.types';

export const revalidate = 30;

export function generateStaticParams() {
  return CATEGORIES.filter((c) => c !== 'overall').map((category) => ({ category }));
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const label = CATEGORY_LABEL[params.category] ?? params.category;
  return {
    title: `${label} Rankings 2026`,
    description: `Live, crowd-sourced ${label} fantasy football rankings for 2026, built from head-to-head community votes.`,
    alternates: { canonical: `/rankings/${params.category}` },
  };
}

export default async function RankingsCategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { limit?: string };
}) {
  if (!isActiveCategory(params.category) || params.category === 'overall') notFound();
  const limit = searchParams.limit === 'all' ? 300 : searchParams.limit === '25' ? 25 : 50;
  const rows = await fetchRankings(params.category as Category, limit);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-accent-bright">Live Community Data</p>
      <h1 className="page-title mt-2">{CATEGORY_LABEL[params.category]} Rankings</h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-white/50">Ratings are out of 100 and update as the community votes. Only the current No. 1 receives 100.</p>

      <TokenGate>
        <div className="mt-7 flex flex-col items-center gap-4">
          <CategoryTabs active={params.category} basePath="/rankings" />
          <RankingsFilterBar />
        </div>

        <div className="mt-6">
          <RankingsTable rows={rows} />
        </div>
      </TokenGate>
    </div>
  );
}
