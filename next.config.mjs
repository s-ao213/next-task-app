/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/api/.well-known/:path*',
      },
    ]
  }
};

export default nextConfig;
