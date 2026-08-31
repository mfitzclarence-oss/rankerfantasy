import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryTabs } from '@/components/CategoryTabs';
import { RankingsFilterBar } from '@/components/RankingsFilterBar';
import { RankingsTable } from '@/components/RankingsTable';
import { TokenGate } from '@/components/TokenGate';
import { fetchRankings } from '@/lib/rankings';
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/format';
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
  if (!CATEGORIES.includes(params.category as Category) || params.category === 'overall') notFound();
  const limit = searchParams.limit === 'all' ? 300 : searchParams.limit === '25' ? 25 : 50;
  const rows = await fetchRankings(params.category as Category, limit);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-accent-bright sm:text-left">Live Community Data</p>
      <h1 className="page-title mt-2">{CATEGORY_LABEL[params.category]} Rankings</h1>
      <p className="mt-2 text-center text-white/50 sm:text-left">Started from current ESPN PPR ADP and updated by every community vote.</p>

      <TokenGate>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
