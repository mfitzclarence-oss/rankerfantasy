'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const ITEMS = [
  { href: '/vote', label: 'Vote', icon: VoteIcon },
  { href: '/rankings', label: 'Rankings', icon: RankIcon },
  { href: '/trades', label: 'Trades', icon: TradeIcon },
  { href: '/teams', label: 'Teams', icon: TeamIcon },
  { href: '/actions', label: 'My Actions', icon: ActionsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 overflow-hidden rounded-2xl border border-white/10 bg-ink-950/90 shadow-[0_20px_55px_-18px_rgba(0,0,0,0.95),0_0_35px_-20px_rgba(47,125,244,0.9)] backdrop-blur-xl md:hidden"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {ITEMS.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={clsx(
                'relative flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 text-[9px] font-bold transition-[color,background-color,transform] active:scale-95 min-[390px]:text-[10px]',
                active ? 'bg-accent/12 text-accent-bright' : 'text-white/45 hover:text-white/75'
              )}
            >
              {active ? <span aria-hidden="true" className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent-bright shadow-glow" /> : null}
              <Icon active={!!active} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
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

function TeamIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M2.5 20c.7-4 2.8-6 5.5-6s4.8 2 5.5 6M13 14.3c1-.8 2.1-1.3 3.5-1.3 2.6 0 4.3 2.3 5 7" strokeLinecap="round" />
    </svg>
  );
}

function ActionsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c1.2-3.6 4-5.4 7-5.4S17.8 16.4 19 20" strokeLinecap="round" />
    </svg>
  );
}
