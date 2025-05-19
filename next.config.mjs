/** @type {import('next').NextConfig} */
const nextConfig = {
  // 抑制水合警告，解决由浏览器扩展导致的 hydration mismatch 问题
  reactStrictMode: false,
  // Next.js 中没有直接支持 suppressHydrationWarning 作为顶级配置
  // 我们只能在组件级别使用 suppressHydrationWarning 属性

  // 排除zhuguang目录
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 添加输出配置，用于Edge部署
  output: 'export',
  
  // 禁用图像优化，因为在静态导出中不支持
  images: {
    unoptimized: true,
  },
};

export default nextConfig;