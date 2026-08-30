import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'How RankerFantasy turns head-to-head votes into crowd-sourced fantasy football rankings using an Elo rating system.',
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl">How It Works</h1>
      <p className="mt-3 text-white/60">
        RankerFantasy ranks players by what fantasy managers would actually rather have — not by who scored the
        most points last year. Every ranking on this site is built entirely from real head-to-head votes.
      </p>

      <div className="mt-10 space-y-8">
        <Step n={1} title="Vote head-to-head">
          You&apos;re shown two players and asked one question: &quot;Who would you rather have in fantasy?&quot;
          Tap one, see the next matchup instantly. No account required.
        </Step>
        <Step n={2} title="Every vote updates an Elo rating">
          Each player has a rating per category (Overall, QB, RB, WR, TE, K, D/ST) seeded from current ADP.
          When an underdog beats a favorite, their rating jumps more than it would from beating another underdog —
          the same math chess uses to rate players.
        </Step>
        <Step n={3} title="Smart matchmaking, not random pairs">
          The matchup engine prioritizes players with similar ratings, avoids repeating pairs you&apos;ve just seen,
          surfaces under-voted players, and occasionally throws in a mismatched pair for calibration. Overall voting
          only pairs draft-relevant QB/RB/WR/TE players — no first-round running backs against kickers.
        </Step>
        <Step n={4} title="Rankings are always live">
          The Rankings pages sort every player by their current community rating. Watch where the crowd disagrees
          with conventional ADP — that gap is the signal.
        </Step>
        <Step n={5} title="Trade Vote settles debates">
          Submit any trade and the community weighs in: Team A Wins, Fair Trade, or Team B Wins — with your league&apos;s
          format, scoring, size, and superflex status shown alongside, because those materially change a trade&apos;s value.
        </Step>
      </div>

      <div className="mt-12 flex justify-center gap-3">
        <Link href="/vote" className="btn-primary">Start Voting</Link>
        <Link href="/rankings" className="btn-secondary">View Rankings</Link>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent-bright">
        {n}
      </span>
      <div>
        <h2 className="font-display text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/55">{children}</p>
      </div>
    </div>
  );
}
