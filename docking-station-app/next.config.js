/** @type {import('next').NextConfig} */

const NODE_ENV = process.env.NODE_ENV ?? 'development'
const SERVER_PORT = process.env.SERVER_PORT ?? 3001

const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination:
          NODE_ENV === "development"
            ? `http://127.0.0.1:${SERVER_PORT}/api/:path*`
            : "/api/:path*",
      },
      {
        source: "/docs",
        destination:
          NODE_ENV === "development"
            ? `http://127.0.0.1:${SERVER_PORT}/docs`
            : "/api/docs",
      },
      {
        source: "/openapi.json",
        destination:
          NODE_ENV === "development"
            ? `http://127.0.0.1:${SERVER_PORT}/openapi.json`
            : "/api/openapi.json",
      },
    ];
  },
};

module.exports = nextConfig;
