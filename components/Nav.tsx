import Link from 'next/link';
import { BrandWordmark } from '@/components/BrandWordmark';

const LINKS = [
  { href: '/vote', label: 'Vote' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/trades', label: 'Trades' },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-5 sm:pt-3">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center rounded-[1.35rem] border border-ink-700/90 bg-ink-950/90 px-3 py-2.5 shadow-card backdrop-blur-xl sm:px-6 sm:py-3 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="mx-auto flex items-center py-1 md:mx-0 md:justify-self-start" aria-label="RankUp Fantasy home">
          <BrandWordmark />
        </Link>

        <nav className="hidden items-center justify-center gap-1 md:flex" aria-label="Main navigation">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href as any}
              className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white/60 transition-colors hover:bg-ink-800 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex md:justify-self-end">
          <Link href="/vote" className="btn-primary !px-5 !py-2.5 text-sm">
            Start voting
          </Link>
        </div>
      </div>
    </header>
  );
}
