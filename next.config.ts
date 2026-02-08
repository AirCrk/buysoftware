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
        // 允许任意外部图片域名 (HTTPS)
        protocol: 'https',
        hostname: '*',
      },
      {
        // 允许任意外部图片域名 (HTTP)
        protocol: 'http',
        hostname: '*',
      },
      {
        // 显式添加特定域名以防通配符不生效
        protocol: 'http',
        hostname: 'img.shenzhendeyang.com',
      },
    ],
  },
};

export default nextConfig;
