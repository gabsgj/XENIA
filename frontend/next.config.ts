import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Allow Next/Image to load remote images from Unsplash
    domains: ["images.unsplash.com"],
  },
};

export default nextConfig;
