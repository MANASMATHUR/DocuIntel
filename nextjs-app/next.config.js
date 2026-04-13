/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  webpack: (config) => {
    // pdf-parse and pdfjs-dist optional deps
    config.resolve.alias.canvas = false;
    return config;
  },
}

module.exports = nextConfig
