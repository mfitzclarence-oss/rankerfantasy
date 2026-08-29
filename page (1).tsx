import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TradeCard } from '@/components/TradeCard';
import { TokenGate } from '@/components/TokenGate';
import { fetchTrade } from '@/lib/trades';

export const revalidate = 15;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const trade = await fetchTrade(params.id);
  if (!trade) return { title: 'Trade Not Found' };
  const a = trade.sideA.map((p) => p.full_name).join(', ');
  const b = trade.sideB.map((p) => p.full_name).join(', ');
  return {
    title: `Trade: ${a} for ${b}`,
    description: `Vote on this fantasy trade — ${a} for ${b}. Team A Wins, Fair Trade, or Team B Wins?`,
    alternates: { canonical: `/trades/${params.id}` },
  };
}

export default async function TradeDetailPage({ params }: { params: { id: string } }) {
  const trade = await fetchTrade(params.id);
  if (!trade) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-white">Trade Detail</h1>
      <p className="mt-1 text-sm text-white/50">Submitted {new Date(trade.created_at).toLocaleDateString()}</p>
      <TokenGate>
        <div className="mt-6">
          <TradeCard trade={trade} linkToDetail={false} />
        </div>
      </TokenGate>
    </div>
  );
}
