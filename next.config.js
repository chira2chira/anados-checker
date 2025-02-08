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
            value: "public, max-age=21600, must-revalidate", // 6 hours
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
