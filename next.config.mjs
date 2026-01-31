/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: true,
  assetPrefix: './',
  basePath: '',
  experimental: {
    optimizeCss: false
  }
}

export default nextConfig
