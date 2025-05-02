/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        port: '',
        pathname: '/profile_images/**', // Allow any image under /profile_images/
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com', // 添加 Twitter 默认头像域名
        port: '',
        pathname: '/sticky/default_profile_images/**', // 允许默认头像路径
      },
    ],
  },
};

export default nextConfig; 