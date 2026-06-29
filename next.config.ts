import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fully static export — the app is client-side only (localStorage), so it
  // ships as plain static files. Detail screens use query params (?p=<id>)
  // instead of dynamic routes so runtime-created projects work on refresh.
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
