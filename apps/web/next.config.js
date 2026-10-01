const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable transpilation of the shared workspace package
  transpilePackages: ["@medico/shared"],

  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/location/detect",
        destination: "/api/location/detect",
      },
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL || "http://localhost:5000"}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
