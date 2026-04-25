import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  reactStrictMode: true,
  compress: true,
  trailingSlash: true,
  output: 'export',
  basePath: isProd ? '/knowledge-base' : '',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', 'recharts'],
  },
}

export default nextConfig
