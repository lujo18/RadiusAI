/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-a6c7227464b441469db7279bf1d9551d.r2.dev',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/brand/:path*',
        destination: 'http://localhost:8000/brand/:path*',
      },
      {
        source: '/api/generate/:path*',
        destination: 'http://localhost:8000/generate/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
