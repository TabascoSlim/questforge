/** @type {import('next').NextConfig} */
// The browser calls /api/* on this site; Next.js forwards those requests to the backend.
// API_INTERNAL_URL is the backend address as seen from the Next.js server
// (http://backend:8000 inside Docker, http://localhost:8000 when running locally).
const API_INTERNAL_URL = process.env.API_INTERNAL_URL || 'http://localhost:8000';

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_INTERNAL_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
