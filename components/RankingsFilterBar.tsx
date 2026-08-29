'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';

const FILTERS = [
  { key: '25', label: 'Top 25' },
  { key: '50', label: 'Top 50' },
  { key: 'all', label: 'All' },
];

export function RankingsFilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const active = params.get('limit') ?? '50';

  function setFilter(key: string) {
    const next = new URLSearchParams(params.toString());
    next.set('limit', key);
    router.push(`?${next.toString()}` as any, { scroll: false });
  }

  return (
    <div className="flex gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => setFilter(f.key)}
          className={clsx(
            'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
            active === f.key
              ? 'border-accent bg-accent text-white'
              : 'border-ink-600 bg-ink-800/60 text-white/60 hover:text-white'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
