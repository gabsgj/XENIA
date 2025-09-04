import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  eslint: {
    // Disable ESLint during builds for Docker
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checks during builds for Docker  
    ignoreBuildErrors: true,
  },
  images: {
    // Allow Next/Image to load remote images from Unsplash
    domains: ["images.unsplash.com"],
  },
};

export default nextConfig;
