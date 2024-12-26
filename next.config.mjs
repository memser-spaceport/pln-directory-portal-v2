/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/irl/lw24-web3',
        destination: '/irl?location=Thailand',
        permanent: true,
      }
    ];
  },
  env: {
    POSTHOG_KEY: process.env.POSTHOG_KEY,
    POSTHOG_HOST: process.env.POSTHOG_HOST,
    DIRECTORY_API_URL: process.env.DIRECTORY_API_URL,
    PROTOSPHERE_URL: process.env.PROTOSPHERE_URL,
    GET_SUPPORT_URL: process.env.GET_SUPPORT_URL,
    PRIVY_AUTH_ID: process.env.PRIVY_AUTH_ID,
    APPLICATION_BASE_URL: process.env.APPLICATION_BASE_URL,
    AUTH_API_URL: process.env.AUTH_API_URL,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    HUSKY_API_URL: process.env.HUSKY_API_URL,
    TEXT_EDITOR_API_KEY: process.env.TEXT_EDITOR_API_KEY,
    REVALIDATE_TOKEN: process.env.REVALIDATE_TOKEN,
    GOOGLE_SITE_KEY: process.env.GOOGLE_SITE_KEY,
    GOOGLE_SECRET_KEY: process.env.GOOGLE_SECRET_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental:{
    serverSourceMaps:false
  },
};

export default nextConfig;
