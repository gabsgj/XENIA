/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'standalone',
  eslint: {
    // Disable ESLint during builds for production
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checks during builds for production  
    ignoreBuildErrors: true,
  },
  images: {
    // Use remotePatterns for external images and allow local avatars
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      }
    ],
  },
};

module.exports = nextConfig;
