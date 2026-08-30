import Link from 'next/link';
import { TokenBadge } from '@/components/TokenBadge';
import { LogoWordmark } from '@/components/LogoWordmark';

const LINKS = [
  { href: '/vote', label: 'Vote' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/trades', label: 'Trades' },
  { href: '/how-it-works', label: 'How It Works' },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-5 sm:pt-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[1.35rem] border border-ink-700/90 bg-ink-950/90 px-3 py-2.5 shadow-card backdrop-blur-xl sm:px-6 sm:py-3">
        <Link href="/" className="flex items-center py-1">
          <LogoWordmark className="h-auto w-[210px] sm:w-[330px] lg:w-[400px]" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href as any}
              className="rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white/60 transition-colors hover:bg-ink-800 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <span className="mx-2 h-4 w-px bg-ink-600" />
          <a
            href="https://www.orderupfantasy.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-ink-600 bg-ink-850 px-4 py-2 text-sm font-bold text-white transition-colors hover:border-accent hover:text-accent-bright"
          >
            Order Up Fantasy ↗
          </a>
          <a
            href="https://www.instagram.com/orderupfantasy/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Order Up Fantasy on Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-600 bg-ink-850 text-white/70 transition-colors hover:border-accent hover:text-white"
          >
            <InstagramIcon />
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <TokenBadge />
          <Link href="/auth/sign-in" className="btn-secondary !px-5 !py-2 text-sm">
            Sign In
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <a href="https://www.orderupfantasy.com/" target="_blank" rel="noopener noreferrer" className="hidden text-xs font-semibold text-blue min-[390px]:block">Order Up ↗</a>
          <TokenBadge />
        </div>
      </div>
    </header>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
