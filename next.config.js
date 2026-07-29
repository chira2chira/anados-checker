const { i18n } = require("./next-i18next.config");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  // yamlUtil.tsがprocess.cwd()基点でfs.readdirSync("public/static/image/still")を実行するため、
  // Turbopackのファイルトレースがpublic配下の画像(約700MB)をServerless Functionに丸ごと同梱してしまう。
  // publicの読み取りはSSG(still/manager, still/nine-stills)のビルド時のみでランタイムには不要、
  // かつVercelではpublic配下は静的アセットとして別途配信されるため、トレース対象から除外する。
  outputFileTracingExcludes: {
    "**": ["./public/**"],
  },
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
{
        source: "/:path(favicon.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, immutable", // 1 week
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
