import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["puppeteer", "@langchain/community"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // puppeteer 只在服务端/本地使用，不打包进客户端
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;
