import type { Metadata } from 'next';
import { Imprima } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { BottomNav } from '@/components/BottomNav';
import { Analytics } from '@/components/Analytics';
import { BrandWordmark } from '@/components/BrandWordmark';

const imprima = Imprima({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-imprima',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rankupfantasy.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'RankUp Fantasy — Vote. Rank. Rise.',
    template: '%s | RankUp Fantasy',
  },
  description:
    'Who would you rather draft? Vote head-to-head on NFL fantasy football players and build live, crowd-sourced rankings for the 2026 season.',
  openGraph: {
    title: 'RankUp Fantasy — Vote. Rank. Rise.',
    description:
      'Thousands of head-to-head votes create rankings built by fantasy players, not experts.',
    url: SITE_URL,
    siteName: 'RankUp Fantasy',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RankUp Fantasy — Vote. Rank. Rise.',
    description: 'Who would you rather draft? Vote head-to-head and build the community rankings.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={imprima.variable}>
      <body className="flex min-h-dvh flex-col bg-ink-950 font-sans antialiased">
        <Nav />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
        <BottomNav />
        <Analytics />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-800 py-10 pb-24 md:pb-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 text-sm text-white/45 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <BrandWordmark />
          <p className="mt-3 max-w-sm">Community rankings built by fantasy players, not experts.</p>
          <BrandWordmark
            prefix="Style"
            descriptor="Fantasy Apps"
            compact
            className="mt-6 opacity-90"
          />
        </div>
        <div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white/70">Explore</p>
          <div className="flex flex-col gap-2.5">
            <a href="/rankings" className="hover:text-white">Rankings</a>
            <a href="/trades" className="hover:text-white">Trade Vote</a>
            <a href="https://www.orderupfantasy.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Order Up Fantasy ↗</a>
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white/70">Support &amp; social</p>
          <div className="flex flex-col gap-2.5">
            <a href="https://github.com/mfitzclarence-oss/rankerfantasy/issues/new?template=bug_report.yml" target="_blank" rel="noopener noreferrer" className="hover:text-white">Report a bug ↗</a>
            <a href="https://github.com/mfitzclarence-oss/rankerfantasy/issues/new?template=feature_request.yml" target="_blank" rel="noopener noreferrer" className="hover:text-white">Suggest a feature ↗</a>
            <a href="https://www.instagram.com/orderupfantasy/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Order Up Instagram ↗</a>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl border-t border-ink-800 px-5 pt-5 text-xs text-white/25 sm:px-6">
        &copy; {new Date().getFullYear()} StyleUp Fantasy Apps. RankUp Fantasy and Order Up Fantasy are StyleUp Fantasy Apps products.
      </p>
    </footer>
  );
}
