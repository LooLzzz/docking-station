import withPWA from '@ducanh2912/next-pwa'
import packageJson from './package.json' assert { type: 'json' }

const NODE_ENV = process.env.NODE_ENV ?? 'development'
const SERVER_PORT = process.env.SERVER_PORT ?? 3001

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  env: {
    NPM_PACKAGE_VERSION: packageJson.version,
  },

  webpack: (config) => {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.(".svg"))

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      },
    )

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i

    return config
  },

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
    ]
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: NODE_ENV === 'development',
})(nextConfig)
