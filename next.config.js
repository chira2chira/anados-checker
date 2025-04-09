const { i18n } = require("./next-i18next.config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  async headers() {
    return [
      {
        source: "/static/image/(char|eidos)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=21600, immutable", // 6 hours
          },
        ],
      },
      {
        source: "/static/image/(class|common)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=43200, immutable", // 12 hours
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
