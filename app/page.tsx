import Link from 'next/link';
import { VoteArena } from '@/components/VoteArena';
import { OrderUpPromo } from '@/components/OrderUpPromo';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { initials, byeLabel } from '@/lib/format';

export const revalidate = 60;

async function getTopOverall() {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from('player_ratings')
    .select('rating, comparisons, players(id, full_name, position, team_abbreviation, headshot_url, slug, bye_week)')
    .eq('category', 'overall')
    .order('rating', { ascending: false })
    .limit(6);
  return data ?? [];
}

export default async function HomePage() {
  const top = await getTopOverall();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-700">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_800px_400px_at_20%_0%,rgba(255,122,53,0.12),transparent_65%),radial-gradient(ellipse_700px_400px_at_90%_100%,rgba(92,147,255,0.10),transparent_65%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-14 text-center sm:px-6 sm:pt-20">
          <span className="pill mb-5">2026 Season &middot; Community Powered</span>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-6xl">
            Who would you <span className="text-accent-bright">rather</span> draft?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-white/60 sm:text-lg">
            Vote. Rank. Settle the debate. Thousands of head-to-head votes create rankings built by fantasy players, not experts.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/vote" className="btn-primary">Start Voting</Link>
            <Link href="/rankings" className="btn-secondary">View Rankings</Link>
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl pb-14">
          <VoteArena category="overall" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Live Community Rankings</h2>
            <p className="mt-1 text-sm text-white/50">Updated with every vote. Overall, skill positions only.</p>
          </div>
          <Link href="/rankings" className="hidden text-sm font-semibold text-accent-bright hover:underline sm:block">
            View full rankings →
          </Link>
        </div>

        <div className="card divide-y divide-ink-700 overflow-hidden">
          {top.length === 0 && (
            <p className="p-6 text-sm text-white/40">
              Rankings will appear here once the player database is seeded and voting begins — see the README.
            </p>
          )}
          {top.map((row: any, i: number) => (
            <div key={row.players.id} className="flex items-center gap-4 px-4 py-3 sm:px-6">
              <span className="w-6 shrink-0 text-center font-display text-lg font-bold text-white/30">{i + 1}</span>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-white/70">
                {initials(row.players.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{row.players.full_name}</p>
                <p className="text-xs text-white/40">
                  {row.players.position} &middot; {row.players.team_abbreviation} &middot; {byeLabel(row.players.bye_week)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-accent-bright">{Math.round(row.rating)}</p>
                <p className="text-[11px] text-white/30">{row.comparisons} votes</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/rankings" className="mt-4 block text-center text-sm font-semibold text-accent-bright sm:hidden">
          View full rankings →
        </Link>
      </section>

      <section className="border-t border-ink-800 bg-ink-900/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-6 font-display text-2xl font-bold text-white">Vote by Position</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {[
              ['QB', 'qb'], ['RB', 'rb'], ['WR', 'wr'], ['TE', 'te'], ['K', 'k'], ['D/ST', 'dst'],
            ].map(([label, slug]) => (
              <Link
                key={slug}
                href={`/vote/${slug}` as any}
                className="card flex flex-col items-center gap-2 p-5 text-center transition-colors hover:border-accent/50"
              >
                <span className="font-display text-2xl font-black text-white">{label}</span>
                <span className="text-xs text-white/40">Vote now →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <OrderUpPromo />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="card grid grid-cols-1 items-center gap-8 overflow-hidden p-8 sm:grid-cols-2 sm:p-12">
          <div>
            <span className="pill mb-4">New: Trade Vote</span>
            <h2 className="font-display text-3xl font-bold text-white">Let the community judge your trade.</h2>
            <p className="mt-3 text-white/60">
              Submit any trade — 1-for-1 up to larger multi-player deals — and get a real-time read from other
              fantasy managers: Team A Wins, Fair Trade, or Team B Wins.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/trades/new" className="btn-primary">Submit a Trade</Link>
              <Link href="/trades" className="btn-secondary">Browse Trades</Link>
            </div>
          </div>
          <TradePreviewCard />
        </div>
      </section>

      <section className="border-t border-ink-800 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-8 text-center font-display text-2xl font-bold text-white">How It Works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <HowStep n={1} title="Vote head-to-head" body="Two players. One tap. Who would you rather have in fantasy this season?" />
            <HowStep n={2} title="Ratings update instantly" body="Every vote feeds an Elo rating system — beating a favorite is worth more than beating a scrub." />
            <HowStep n={3} title="Rankings emerge from the crowd" body="No experts, no editorial bias — just thousands of real fantasy managers' preferences, aggregated live." />
          </div>
        </div>
      </section>
    </div>
  );
}

function HowStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="card p-6">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 font-display font-bold text-accent-bright">
        {n}
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/55">{body}</p>
    </div>
  );
}

function TradePreviewCard() {
  return (
    <div className="card bg-ink-800/60 p-5">
      <div className="flex items-center justify-between text-xs text-white/40">
        <span>Dynasty &middot; PPR &middot; 12-team</span>
        <span>142 votes</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-2 font-semibold text-white/70">Team A gets</p>
          <p className="text-white">Jahmyr Gibbs</p>
        </div>
        <div>
          <p className="mb-2 font-semibold text-white/70">Team B gets</p>
          <p className="text-white">Puka Nacua</p>
          <p className="text-white">James Cook III</p>
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-700">
        <div className="flex h-full">
          <div className="h-full bg-accent" style={{ width: '47%' }} />
          <div className="h-full bg-white/20" style={{ width: '18%' }} />
          <div className="h-full bg-positive" style={{ width: '35%' }} />
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-white/40">
        <span>Team A 47%</span>
        <span>Fair 18%</span>
        <span>Team B 35%</span>
      </div>
    </div>
  );
}
