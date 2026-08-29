import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VoteArena } from '@/components/VoteArena';
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/format';
import type { Category } from '@/lib/database.types';

export function generateStaticParams() {
  return CATEGORIES.filter((c) => c !== 'overall').map((category) => ({ category }));
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const label = CATEGORY_LABEL[params.category] ?? params.category;
  return {
    title: `Vote — ${label} Rankings`,
    description: `Head-to-head ${label} voting. Pick a winner, build the community ${label} rankings.`,
  };
}

export default function VoteCategoryPage({ params }: { params: { category: string } }) {
  if (!CATEGORIES.includes(params.category as Category)) notFound();
  return <VoteArena category={params.category as Category} />;
}
