import type { Metadata } from 'next';
import { TradeBuilder } from '@/components/TradeBuilder';
import { TokenGate } from '@/components/TokenGate';

export const metadata: Metadata = {
  title: 'Submit a Trade',
  description: 'Propose a fantasy football trade and let the community judge it — Team A Wins, Fair Trade, or Team B Wins.',
};

export default function NewTradePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">Submit a Trade</h1>
      <p className="mt-2 text-white/50">Add players to each side, set your league context, and see what the community thinks.</p>
      <TokenGate>
        <div className="mt-6">
          <TradeBuilder />
        </div>
      </TokenGate>
    </div>
  );
}
