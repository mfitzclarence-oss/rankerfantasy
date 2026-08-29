import type { Metadata } from 'next';
import { VoteArena } from '@/components/VoteArena';

export const metadata: Metadata = {
  title: 'Vote — Who Would You Rather Draft?',
  description: 'Head-to-head fantasy football voting. Pick a winner, build the community rankings.',
};

export default function VotePage() {
  return <VoteArena category="overall" />;
}
