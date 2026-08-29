import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { initials } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-2xl font-bold text-white">You&apos;re not signed in</h1>
        <p className="mt-2 text-sm text-white/50">
          Voting and rankings work without an account. Sign in to save favorites and see your voting history.
        </p>
        <Link href="/auth/sign-in" className="btn-primary mt-6">Sign In</Link>
      </div>
    );
  }

  const [{ count: voteCount }, { count: tradeCount }, { data: favourites }] = await Promise.all([
    supabase.from('votes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('trades').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('favourites')
      .select('players(id, full_name, slug, position, team_abbreviation)')
      .eq('user_id', user.id)
      .limit(20),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="card flex items-center gap-4 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-lg font-bold text-accent-bright">
          {initials(user.email ?? 'U')}
        </div>
        <div>
          <p className="font-display text-lg font-bold text-white">{user.email}</p>
          <p className="text-sm text-white/40">Member since {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="font-display text-2xl font-bold text-white">{voteCount ?? 0}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-white/40">Votes Cast</p>
        </div>
        <div className="card p-4 text-center">
          <p className="font-display text-2xl font-bold text-white">{tradeCount ?? 0}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-white/40">Trades Submitted</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-white">Favorite Players</h2>
        <div className="mt-3 space-y-2">
          {(!favourites || favourites.length === 0) && (
            <p className="text-sm text-white/40">No favorites yet — star a player from their profile page.</p>
          )}
          {favourites?.map((f: any) => (
            <Link
              key={f.players.id}
              href={`/players/${f.players.slug}`}
              className="card flex items-center justify-between p-3 hover:border-accent/50"
            >
              <span className="text-sm text-white">{f.players.full_name}</span>
              <span className="text-xs text-white/40">{f.players.position} &middot; {f.players.team_abbreviation}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
