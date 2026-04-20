/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-a6c7227464b441469db7279bf1d9551d.r2.dev",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/brand/:path*",
        destination: "http://localhost:8000/brand/:path*",
      },
      {
        source: "/api/v1/generate/:path*",
        destination: "http://localhost:8000/generate/:path*",
      },
    ];
  },
 
};

module.exports = nextConfig;
