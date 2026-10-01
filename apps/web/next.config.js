/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable transpilation of the shared workspace package
  transpilePackages: ["@medico/shared"],

  // Optimize for Vercel deployment
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
