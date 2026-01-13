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
