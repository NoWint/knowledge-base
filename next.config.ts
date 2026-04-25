/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  reactStrictMode: true,
  compress: true,
  basePath: '/knowledge-base',
  assetPrefix: '/knowledge-base',
  output: 'export',
  trailingSlash: true,
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react', 'recharts'],
  },
}

export default nextConfig
