/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the pg driver (used by @prisma/adapter-pg) out of webpack's server
  // bundle - it does its own dynamic requires that don't play well with
  // bundling. Next.js will require() it directly from node_modules instead.
  experimental: {
    serverComponentsExternalPackages: ["pg", "@prisma/adapter-pg"],
  },
};

module.exports = nextConfig;
