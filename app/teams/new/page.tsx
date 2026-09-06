import type { Metadata } from 'next';
import Link from 'next/link';
import { CommunityTeamBuilder } from '@/components/CommunityTeamBuilder';

export const metadata: Metadata = {
  title: 'Add Your Fantasy Team',
  description: 'Add your fantasy football roster and let the RankUp community grade it from A+ to F.',
  alternates: { canonical: '/teams/new' },
};

export default function NewCommunityTeamPage() {
  return (
    <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-10">
      <Link href={'/teams' as any} className="text-sm font-bold text-white/45 hover:text-white">← Back to team ratings</Link>
      <div className="mt-5 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent-bright">Community rating</p>
        <h1 className="page-title mt-2">Put Your Team Up</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/55">
          Add your roster and league settings. Other fantasy players will grade the team from A+ to F.
        </p>
      </div>
      <div className="mt-7">
        <CommunityTeamBuilder />
      </div>
    </div>
  );
}
