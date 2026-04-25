import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  reactStrictMode: true,
  compress: true,
  trailingSlash: true,
  output: 'export',
  basePath: '/knowledge-base',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', 'recharts'],
  },
}

export default nextConfig
