import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'localhost:3005'] },
  },
  // Disable filesystem cache when disk space is low
  webpack: (config) => {
    config.cache = false
    return config
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
