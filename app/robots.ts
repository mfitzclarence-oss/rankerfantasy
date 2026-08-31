import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rankerfantasy3.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/auth/', '/api/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
