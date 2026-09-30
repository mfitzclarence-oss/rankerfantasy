import Link from 'next/link';
import { BrandWordmark } from '@/components/BrandWordmark';

const LINKS = [
  { href: '/vote', label: 'Vote' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/trades', label: 'Trades' },
  { href: '/teams', label: 'Rate Teams' },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5 sm:pt-3">
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center rounded-2xl border border-ink-700/90 bg-ink-950/90 px-12 py-1.5 shadow-card backdrop-blur-xl sm:px-14 sm:py-3 md:grid-cols-[1fr_auto_1fr] md:rounded-[1.35rem] md:px-6">
        <div className="ml-0 mr-auto flex flex-col items-start md:mx-0 md:justify-self-start">
          <Link href="/" className="flex items-center py-1" aria-label="RankUp Fantasy home">
            <BrandWordmark />
          </Link>
        </div>

        <nav className="hidden items-center justify-center gap-1 md:flex" aria-label="Main navigation">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href as any} className="rounded-lg px-2 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white/60 transition-colors hover:bg-ink-800 hover:text-white lg:px-4">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2 sm:right-3 md:static md:translate-y-0 md:justify-self-end">
          <a href="https://www.orderupfantasy.com/" target="_blank" rel="noopener noreferrer" aria-label="Visit OrderUp Fantasy (opens in a new tab)" title="OrderUp Fantasy" className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] leading-none text-white transition-colors hover:border-accent/60 hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <span className="font-display text-[13px] font-extrabold tracking-[-0.06em]">O<span className="text-accent-bright">U</span></span>
            <span className="mt-0.5 text-[5px] font-extrabold uppercase tracking-[0.22em] text-white/45">Fantasy</span>
          </a>
          <a href="https://www.instagram.com/styleupfantasy/" target="_blank" rel="noopener noreferrer" aria-label="StyleUpFantasy on Instagram (opens in a new tab)" title="@StyleUpFantasy on Instagram" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] text-white transition-colors hover:border-accent/60 hover:bg-accent/10 hover:text-accent-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
          </a>
          <Link href={'/actions' as any} className="btn-secondary hidden !px-4 !py-2.5 text-sm xl:inline-flex">My Actions</Link>
          <Link href="/vote" className="btn-primary hidden !px-5 !py-2.5 text-sm lg:inline-flex">Start voting</Link>
        </div>
      </div>
    </header>
  );
}
