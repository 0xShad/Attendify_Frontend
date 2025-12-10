import type { NextConfig } from "next";
import { ALLOWED_IMAGE_DOMAINS, ALLOWED_IMAGE_REMOTE_PATTERNS } from "./src/config/images";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow Next's <Image> component to load images from google storage
  images: {
    domains: ALLOWED_IMAGE_DOMAINS,
    remotePatterns: ALLOWED_IMAGE_REMOTE_PATTERNS,
  },
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
