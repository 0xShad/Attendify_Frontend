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
};

export default nextConfig;
