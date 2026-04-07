import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/peak-sentinel" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: isProd ? "/peak-sentinel/" : "",
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
