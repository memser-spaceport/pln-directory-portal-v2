/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    POSTHOG_KEY: process.env.POSTHOG_KEY,
    POSTHOG_HOST: process.env.POSTHOG_HOST,
    DIRECTORY_API_URL: process.env.DIRECTORY_API_URL,
    PROTOSPHERE_URL: process.env.PROTOSPHERE_URL,
    GET_SUPPORT_URL: process.env.GET_SUPPORT_URL,
    LOGIN_BANNER_URL: process.env.LOGIN_BANNER_URL,
    PRIVY_AUTH_ID: process.env.PRIVY_AUTH_ID,
    DIRECTORY_API_URL: process.env.DIRECTORY_API_URL,
    APPLICATION_BASE_URL: process.env.APPLICATION_BASE_URL,
    AUTH_API_URL: process.env.AUTH_API_URL,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    IRL_DEFAULT_TOPICS: process.env.IRL_DEFAULT_TOPICS,
    IRL_PGF_FORM_URL: process.env.IRL_PGF_FORM_URL,
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
