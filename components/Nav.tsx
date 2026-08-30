import Link from 'next/link';
import Image from 'next/image';
import { TokenBadge } from '@/components/TokenBadge';

const LINKS = [
  { href: '/vote', label: 'Vote' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/trades', label: 'Trades' },
  { href: '/how-it-works', label: 'How It Works' },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-wordmark.png"
            alt="RankerFantasy"
            width={354}
            height={86}
            priority
            className="h-12 w-auto sm:h-14 lg:h-16"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href as any}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-ink-800 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
          <span className="mx-2 h-4 w-px bg-ink-600" />
          <a
            href="https://www.orderupfantasy.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-ink-600 bg-ink-850 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-accent hover:text-accent-bright"
          >
            Order Up Fantasy ↗
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
