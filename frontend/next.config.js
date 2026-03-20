/** @type {import('next').NextConfig} */

// Determine the backend API URL based on environment
const getBackendUrl = () => {
  // In production (Netlify or any deployment), use environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Default to localhost for development
  return 'http://localhost:8000';
};

const nextConfig = {
  reactStrictMode: true,
  
  // Enable image optimization with common patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/**',
      },
    ],
  },
  
  // Rewrite API routes to backend - only works in development
  // In production (Netlify), use environment variable and API client calls directly
  async rewrites() {
    // Only rewrite in development if using localhost
    if (process.env.NODE_ENV === 'development') {
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
    }
    
    // In production, no rewrites needed - frontend calls backend directly via environment variables
    return [];
  },
  
  // Redirect trailing slashes
  trailingSlash: false,
  
  // Production-grade configuration
  productionBrowserSourceMaps: false,
  compress: true,
};

module.exports = nextConfig;
