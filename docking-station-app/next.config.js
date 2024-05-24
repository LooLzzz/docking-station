/** @type {import('next').NextConfig} */

const NODE_ENV = process.env.NODE_ENV ?? 'development'
const SERVER_PORT = process.env.SERVER_PORT ?? 3001

const nextConfig = {
  output: 'standalone',

  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: `http://127.0.0.1:${SERVER_PORT}/api/:path*`,
      },
      {
        source: "/docs",
        destination: `http://127.0.0.1:${SERVER_PORT}/docs`,
      },
      {
        source: "/openapi.json",
        destination: `http://127.0.0.1:${SERVER_PORT}/openapi.json`,
      },
    ];
  },
};

module.exports = nextConfig;
