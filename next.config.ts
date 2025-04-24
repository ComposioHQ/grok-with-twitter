import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'x.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'twitter.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
