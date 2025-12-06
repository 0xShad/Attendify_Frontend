import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warnings should not fail the build
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
