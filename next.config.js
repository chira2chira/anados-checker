const { i18n } = require("./next-i18next.config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "anados-collection-tracker.b-cdn.net",
        pathname: "/static/image/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/static/image/(char|eidos)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=21600, s-maxage=86400, immutable", // 6 hours / 1 day(CDN)
          },
        ],
      },
      {
        source: "/static/image/(class|common)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=43200, s-maxage=86400, immutable", // 12 hours / 1 day(CDN)
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
