'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const ITEMS = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/vote', label: 'Vote', icon: VoteIcon },
  { href: '/rankings', label: 'Rankings', icon: RankIcon },
  { href: '/trades', label: 'Trades', icon: TradeIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700 bg-ink-950/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={clsx(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-accent-bright' : 'text-white/50'
              )}
            >
              <Icon active={!!active} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VoteIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="M8 8h5l3 3-3 3H8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 5v14" strokeLinecap="round" />
    </svg>
  );
}
function RankIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="M4 20V10M12 20V4M20 20v-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TradeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="M7 8h13l-3-3M17 16H4l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
