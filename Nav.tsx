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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-wordmark.png"
            alt="RankerFantasy"
            width={900}
            height={300}
            priority
            className="h-8 w-auto sm:h-9"
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
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <TokenBadge />
          <Link href="/auth/sign-in" className="btn-secondary !px-5 !py-2 text-sm">
            Sign In
          </Link>
        </div>

        <Link href="/vote" className="btn-primary !px-4 !py-2 text-sm md:hidden">
          Vote
        </Link>
      </div>
    </header>
  );
}
