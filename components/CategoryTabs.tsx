'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/format';

export function CategoryTabs({ active, basePath }: { active: string; basePath: string }) {
  return (
    <div className="no-scrollbar flex w-full gap-2 overflow-x-auto px-0 sm:flex-wrap">
      {CATEGORIES.map((cat) => {
        const href = cat === 'overall' ? basePath : `${basePath}/${cat}`;
        const isActive = active === cat;
        return (
          <Link
            key={cat}
            href={href as any}
            className={clsx(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'border-accent bg-accent text-white shadow-glow'
                : 'border-ink-600 bg-ink-800/60 text-white/60 hover:border-accent/50 hover:text-white'
            )}
          >
            {CATEGORY_LABEL[cat]}
          </Link>
        );
      })}
    </div>
  );
}
