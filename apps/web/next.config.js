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

  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/",
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    const apiUrl = process.env.API_URL;
    if (apiUrl && !apiUrl.includes("localhost")) {
      return {
        fallback: [
          {
            source: "/api/:path*",
            destination: `${apiUrl}/api/:path*`,
          },
        ],
      };
    }
    if (process.env.NODE_ENV !== "production") {
      return {
        fallback: [
          {
            source: "/api/:path*",
            destination: "http://localhost:5000/api/:path*",
          },
        ],
      };
    }
    return [];
  },
};

module.exports = nextConfig;
