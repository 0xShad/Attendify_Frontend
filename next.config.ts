import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  eslint: {
    dirs: ["src"],
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
