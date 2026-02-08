import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['ali-oss', 'proxy-agent'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: '*.oss-cn-hangzhou.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: '**.oss-*.aliyuncs.com',
      },
      {
        // 允许任意外部图片域名
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
