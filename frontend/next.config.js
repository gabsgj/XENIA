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
    // Allow Next/Image to load remote images from Unsplash
    domains: ["images.unsplash.com"],
  },
};

module.exports = nextConfig;
