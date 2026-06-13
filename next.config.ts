import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained .next/standalone build (minimal server.js + only
  // the node_modules actually needed) for a small Docker image.
  output: "standalone",
};

export default nextConfig;
