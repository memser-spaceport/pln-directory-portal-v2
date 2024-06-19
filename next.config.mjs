/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DIRECTORY_API_URL: process.env.DIRECTORY_API_URL,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/teams',
        permanent: true,
      },
    ];
  },
  env: {
    POSTHOG_KEY: process.env.POSTHOG_KEY,
    POSTHOG_HOST: process.env.POSTHOG_HOST,
    PROTOSPHERE_URL: process.env.PROTOSPHERE_URL,
    GET_SUPPORT_URL: process.env.GET_SUPPORT_URL,
    LOGIN_BANNER_URL: process.env.LOGIN_BANNER_URL,
    PRIVY_AUTH_ID: process.env.PRIVY_AUTH_ID,
    WEB_API_BASE_URL: process.env.WEB_API_BASE_URL,
    APPLICATION_BASE_URL: process.env.APPLICATION_BASE_URL
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
