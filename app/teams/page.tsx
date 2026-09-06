import type { Metadata } from 'next';
import Link from 'next/link';
import { CommunityTeamCard } from '@/components/CommunityTeamCard';
import { TokenGate } from '@/components/TokenGate';
import { fetchCommunityTeams, type CommunityTeamSort } from '@/lib/communityTeams';

export const revalidate = 15;

export const metadata: Metadata = {
  title: 'Rate Fantasy Teams',
  description: 'Submit your fantasy football roster and get a community rating out of 10.',
  alternates: { canonical: '/teams' },
};

const SORTS: { key: CommunityTeamSort; label: string }[] = [
  { key: 'new', label: 'Newest' },
  { key: 'top', label: 'Top Rated' },
  { key: 'most-rated', label: 'Most Rated' },
];

export default async function TeamsPage({ searchParams }: { searchParams: { sort?: string; submitted?: string } }) {
  const sort = SORTS.find((option) => option.key === searchParams.sort)?.key ?? 'new';
  const teams = await fetchCommunityTeams(sort);

  return (
    <div className="mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-3xl border border-accent/25 bg-[radial-gradient(circle_at_top,rgba(47,125,244,0.24),transparent_62%)] px-5 py-8 text-center sm:px-10 sm:py-11">
        <span className="pill mb-4 !border-accent/30 !bg-accent/10 !text-accent-bright">Community Team Check</span>
        <h1 className="page-title">Rate My Team</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
          Put your roster up, add your league settings and see how the fantasy community scores it out of 10.
        </p>
        <Link href={'/teams/new' as any} className="btn-primary mt-6 text-sm">+ Add Your Team</Link>
      </section>

      {searchParams.submitted === '1' && (
        <div className="mt-5 rounded-xl border border-positive/30 bg-positive/10 p-3 text-center text-sm font-bold text-positive">
          Your team is live and ready to be rated.
        </div>
      )}

      <TokenGate>
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 sm:justify-center">
          {SORTS.map((option) => (
            <Link
              key={option.key}
              href={`/teams?sort=${option.key}` as any}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold ${
                sort === option.key
                  ? 'border-accent bg-accent text-white'
                  : 'border-ink-600 bg-ink-800/60 text-white/60 hover:text-white'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {teams.length === 0 && (
            <div className="card p-8 text-center text-white/50">
              No teams are up yet — <Link href={'/teams/new' as any} className="font-bold text-accent-bright hover:underline">add the first roster</Link>.
            </div>
          )}
          {teams.map((team) => <CommunityTeamCard key={team.id} team={team} />)}
        </div>
      </TokenGate>
    </div>
  );
}
