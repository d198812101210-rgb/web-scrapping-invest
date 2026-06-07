/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Supabase Storage (user-uploaded avatars and assets)
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      // Common OAuth provider avatars
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // Local development only
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('puppeteer', 'puppeteer-core');
    }
    return config;
  },
  serverExternalPackages: ['puppeteer', 'puppeteer-core', 'cheerio'],
};

module.exports = nextConfig;
