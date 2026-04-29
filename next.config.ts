import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  transpilePackages: ["mapbox-gl"],
};

export default nextConfig;
