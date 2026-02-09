import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['ali-oss', 'proxy-agent', 'svg-captcha'],
  // eslint: {
  //   // 警告：这允许生产构建即使存在 ESLint 错误也能成功完成。
  //   ignoreDuringBuilds: true,
  // },
  typescript: {
    // 警告：这允许生产构建即使存在 TypeScript 错误也能成功完成。
    ignoreBuildErrors: true,
  },
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
