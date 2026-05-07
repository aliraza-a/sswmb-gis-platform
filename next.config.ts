import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {},
  allowedDevOrigins: ["192.168.100.244"],
  transpilePackages: ["mapbox-gl"],
};

export default nextConfig;
