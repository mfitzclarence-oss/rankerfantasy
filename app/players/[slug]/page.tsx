import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { byeLabel, winPercentageLabel, POSITION_LABEL } from '@/lib/format';
import { PlayerProfileTracker } from '@/components/PlayerProfileTracker';

export const revalidate = 30;

async function getPlayer(slug: string) {
  const supabase = createServerSupabaseClient();
  const { data: player } = await supabase.from('players').select('*').eq('slug', slug).single();
  if (!player) return null;

  const category = player.position.toLowerCase() as 'qb' | 'rb' | 'wr' | 'te' | 'k' | 'dst';

  const [{ data: overallRating }, { data: posRating }] = await Promise.all([
    supabase.from('player_ratings').select('*').eq('player_id', player.id).eq('category', 'overall').maybeSingle(),
    supabase.from('player_ratings').select('*').eq('player_id', player.id).eq('category', category).maybeSingle(),
  ]);

  async function rankFor(cat: string, rating: number | undefined) {
    if (rating === undefined) return null;
    const { count } = await supabase
      .from('player_ratings')
      .select('player_id', { count: 'exact', head: true })
      .eq('category', cat)
      .gt('rating', rating);
    return (count ?? 0) + 1;
  }

  const [overallRank, positionRank] = await Promise.all([
    rankFor('overall', overallRating?.rating),
    rankFor(category, posRating?.rating),
  ]);

  // "Players most often picked over this player" — matchups this player lost, grouped by opponent.
  const { data: losses } = await supabase
    .from('votes')
    .select('player_a_id, player_b_id, winner_id')
    .eq('category', category)
    .or(`player_a_id.eq.${player.id},player_b_id.eq.${player.id}`)
    .neq('winner_id', player.id)
    .limit(500);

  const { data: winsData } = await supabase
    .from('votes')
    .select('player_a_id, player_b_id, winner_id')
    .eq('category', category)
    .or(`player_a_id.eq.${player.id},player_b_id.eq.${player.id}`)
    .eq('winner_id', player.id)
    .limit(500);

  const beatenByIds = tallyOpponents(losses ?? [], player.id);
  const beatsIds = tallyOpponents(winsData ?? [], player.id);

  const opponentIds = [...new Set([...beatenByIds.map((x) => x.id), ...beatsIds.map((x) => x.id)])];
  const { data: opponents } = opponentIds.length
    ? await supabase.from('players').select('id, full_name, slug, position, team_abbreviation').in('id', opponentIds)
    : { data: [] };
  const oppMap = new Map((opponents ?? []).map((o) => [o.id, o]));

  return {
    player,
    overallRating,
    posRating,
    overallRank,
    positionRank,
    category,
    beatenBy: beatenByIds.slice(0, 5).map((x) => ({ ...oppMap.get(x.id)!, count: x.count })).filter((x) => x.id),
    beats: beatsIds.slice(0, 5).map((x) => ({ ...oppMap.get(x.id)!, count: x.count })).filter((x) => x.id),
  };
}

function tallyOpponents(rows: { player_a_id: string; player_b_id: string; winner_id: string }[], playerId: string) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const opp = r.player_a_id === playerId ? r.player_b_id : r.player_a_id;
    counts.set(opp, (counts.get(opp) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getPlayer(params.slug);
  if (!data) return { title: 'Player Not Found' };
  const { player } = data;
  return {
    title: `${player.full_name} — Fantasy Rankings & Elo Rating`,
    description: `${player.full_name} (${player.position}, ${player.team_abbreviation}) community fantasy football ranking, Elo rating, and head-to-head voting record for 2026.`,
    alternates: { canonical: `/players/${player.slug}` },
    openGraph: { title: `${player.full_name} — RankUp Fantasy`, images: player.headshot_url ? [player.headshot_url] : undefined },
  };
}

export default async function PlayerPage({ params }: { params: { slug: string } }) {
  const data = await getPlayer(params.slug);
  if (!data) notFound();
  const { player, overallRating, posRating, overallRank, positionRank, category, beatenBy, beats } = data;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: player.full_name,
    affiliation: player.nfl_team,
    jobTitle: POSITION_LABEL[player.position as keyof typeof POSITION_LABEL],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PlayerProfileTracker playerId={player.id} playerName={player.full_name} position={player.position} />

      <div className="card p-8 text-center sm:text-left">
        <div>
          <h1 className="font-display text-5xl font-black uppercase leading-none tracking-tight text-white sm:text-6xl">{player.full_name}</h1>
          <p className="mt-1 text-white/50">
            {player.position} &middot; {player.nfl_team} &middot; {byeLabel(player.bye_week)}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            {player.injury_status && (
              <span className="pill !border-negative/50 !bg-negative/15 !text-negative">{player.injury_status}</span>
            )}
            {overallRank && <span className="pill">Overall Rank #{overallRank}</span>}
            {positionRank && <span className="pill">{player.position} Rank #{positionRank}</span>}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Elo Rating" value={Math.round(posRating?.rating ?? 1500).toString()} />
        <Stat label="Record" value={`${posRating?.wins ?? 0}-${posRating?.losses ?? 0}`} />
        <Stat label="Win %" value={winPercentageLabel(posRating?.wins ?? 0, posRating?.losses ?? 0)} />
        <Stat label="Total Votes" value={(posRating?.comparisons ?? 0).toLocaleString()} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <OpponentList title="Players most often picked over this player" rows={beatenBy} tone="negative" />
        <OpponentList title="Players this player most often beats" rows={beats} tone="positive" />
      </div>

      <div className="mt-8 text-center">
        <Link href={`/vote/${category}`} className="btn-primary">Vote on {player.position}s →</Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-white/40">{label}</p>
    </div>
  );
}

function OpponentList({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: { id: string; full_name: string; slug: string; position: string; team_abbreviation: string; count: number }[];
  tone: 'positive' | 'negative';
}) {
  return (
    <div className="card p-5">
      <h2 className="font-display text-sm font-bold text-white">{title}</h2>
      <div className="mt-3 space-y-2">
        {rows.length === 0 && <p className="text-sm text-white/40">Not enough votes yet.</p>}
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/players/${r.slug}` as any}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-ink-800"
          >
            <span className="text-sm text-white/80">{r.full_name} <span className="text-white/35">({r.team_abbreviation})</span></span>
            <span className={tone === 'positive' ? 'text-xs font-semibold text-positive' : 'text-xs font-semibold text-negative'}>
              {r.count}x
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
