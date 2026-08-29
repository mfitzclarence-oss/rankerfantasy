/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.espncdn.com' },
      { protocol: 'https', hostname: '**.sleepercdn.com' },
      { protocol: 'https', hostname: '**.nfl.com' },
      { protocol: 'https', hostname: 'static.www.nfl.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
