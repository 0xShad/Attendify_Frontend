import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: "./tsconfig.json",
    ignoreBuildErrors: true,
  },
  eslint: {
    dirs: ["src"],
    ignoreDuringBuilds: true,
  },
  serverRuntimeConfig: {
    port: process.env.PORT || 3000,
  },
};

export default nextConfig;
