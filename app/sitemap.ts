import type { MetadataRoute } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CATEGORIES } from '@/lib/format';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.rankupfantasy.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/vote`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/trades`, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE_URL}/trades/new`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/how-it-works`, changeFrequency: 'monthly', priority: 0.3 },
    ...CATEGORIES.map((c) => ({
      url: `${SITE_URL}/rankings${c === 'overall' ? '' : `/${c}`}`,
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    })),
  ];

  try {
    const supabase = createServerSupabaseClient();
    const { data: players } = await supabase
      .from('players')
      .select('slug, updated_at')
      .eq('fantasy_relevant', true)
      .in('position', ['QB', 'RB', 'WR', 'TE'])
      .limit(1000);
    const { data: trades } = await supabase.from('trades').select('id, created_at').eq('status', 'open').limit(1000);

    const playerRoutes: MetadataRoute.Sitemap = (players ?? []).map((p) => ({
      url: `${SITE_URL}/players/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: 'daily',
      priority: 0.6,
    }));

    const tradeRoutes: MetadataRoute.Sitemap = (trades ?? []).map((t) => ({
      url: `${SITE_URL}/trades/${t.id}`,
      lastModified: t.created_at,
      changeFrequency: 'daily',
      priority: 0.4,
    }));

    return [...staticRoutes, ...playerRoutes, ...tradeRoutes];
  } catch {
    // Supabase not configured yet (e.g. during initial build) — fall back to static routes only.
    return staticRoutes;
  }
}
