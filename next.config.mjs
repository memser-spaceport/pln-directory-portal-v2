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
        destination: 'events/irl?location=Thailand',
        permanent: true,
      },
      {
        source: '/irl',
        destination: 'events/irl',
        permanent: true,
      },
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
    PRIORITY_FEATURED_SECTION: process.env.PRIORITY_FEATURED_SECTION,
    SCHEDULE_ENABLED_LOCATIONS: process.env.SCHEDULE_ENABLED_LOCATIONS,
    SCHEDULE_BASE_URL: process.env.SCHEDULE_BASE_URL,
    IRL_SUBMIT_FORM_URL: process.env.IRL_SUBMIT_FORM_URL,
    PL_EVENTS_BASE_URL: process.env.PL_EVENTS_BASE_URL,
    PL_EVENTS_SUBMISSION_URL: process.env.PL_EVENTS_SUBMISSION_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverSourceMaps: false,
  },
  productionBrowserSourceMaps: true,
};

export default nextConfig;
