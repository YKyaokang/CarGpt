import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 默认使用 Turbopack，需要显式声明 turbopack 配置
  turbopack: {},
  // puppeteer 和 langchain 只在服务端/本地脚本中使用，排除在外
  serverExternalPackages: ["puppeteer", "@langchain/community"],
};

export default nextConfig;
