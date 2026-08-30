import type { Metadata } from 'next';
import Image from 'next/image';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { BottomNav } from '@/components/BottomNav';
import { Analytics } from '@/components/Analytics';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  display: 'swap',
  variable: '--font-poppins',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rankerfantasy.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'RankerFantasy — Vote. Rank. Settle the debate.',
    template: '%s | RankerFantasy',
  },
  description:
    'Who would you rather draft? Vote head-to-head on NFL fantasy football players and build live, crowd-sourced rankings for the 2026 season.',
  openGraph: {
    title: 'RankerFantasy — Vote. Rank. Settle the debate.',
    description:
      'Thousands of head-to-head votes create rankings built by fantasy players, not experts.',
    url: SITE_URL,
    siteName: 'RankerFantasy',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RankerFantasy — Vote. Rank. Settle the debate.',
    description: 'Who would you rather draft? Vote head-to-head and build the community rankings.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
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
    <footer className="hidden border-t border-ink-800 py-10 md:block">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo-wordmark.png" alt="RankerFantasy" width={354} height={86} className="h-5 w-auto opacity-80" />
          <p>&copy; {new Date().getFullYear()} RankerFantasy. Rankings built by fantasy players, not experts.</p>
        </div>
        <div className="flex gap-6">
          <a href="/rankings" className="hover:text-white/70">Rankings</a>
          <a href="/trades" className="hover:text-white/70">Trade Vote</a>
          <a href="/how-it-works" className="hover:text-white/70">How It Works</a>
          <a href="https://www.orderupfantasy.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">
            OrderUp Fantasy ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
