import path from 'path';
import { fileURLToPath } from 'url';
import { withPostHogConfig } from '@posthog/nextjs-config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // DELETE WITH: the `design-canvas/` folder.
  // The canvas capture runs a production build to photograph its frames. Without
  // this line CANVAS_BUILD_DIR is ignored, that build overwrites `.next`, and it
  // takes down the dev server the reviewer is looking at. It fails silently,
  // which is why it is here rather than left to the capture script.
  distDir: process.env.CANVAS_BUILD_DIR || '.next',

  // DELETE WITH: the `design-canvas/` folder.
  // The vendored canvas core does not typecheck under this repo's `strict: true`
  // — four errors in `core/comments-route.ts`, where TypeScript drops a guard's
  // narrowing inside a closure and `shotHash` has no guard at all. The core is
  // byte-for-byte frozen (the canvas has one appearance in every project that
  // installs it) so it cannot be corrected here.
  //
  // Scoped to the two builds that EXIST FOR THE CANVAS, and no others:
  //   CANVAS_BUILD_DIR            the local capture build, photographed and thrown away
  //   NEXT_PUBLIC_CANVAS_VIEW_ONLY  the read-only published canvas (pln-prototypes)
  // A real `npm run build` sets neither and still typechecks everything, core
  // included. Without the second condition the published build fails outright,
  // because the vendored core is in the tree whether or not the canvas is served.
  typescript: {
    ignoreBuildErrors: !!process.env.CANVAS_BUILD_DIR || process.env.NEXT_PUBLIC_CANVAS_VIEW_ONLY === '1',
  },

  // DELETE WITH: the `design-canvas/` folder.
  // The captured frames live in `design-canvas/shots/`, outside `public/` on
  // purpose, and NOTHING IMPORTS THEM — the shots route reads them off disk by
  // id. So a serverless deployment traces the route's bundle, finds no reference
  // to them, and ships a function that answers every picture with a 404: a canvas
  // of empty frames, from a build that succeeded.
  //
  // Verify after a build by reading
  // `.next/server/app/api/design-canvas/shots/route.js.nft.json` — the webp files
  // should be listed there.
  outputFileTracingIncludes: {
    '/api/design-canvas/shots': ['./design-canvas/shots/**'],
  },
  // Dev-only: lets the dev server accept HMR/asset requests when accessed
  // through a tunnel domain instead of localhost directly. No effect on
  // `next build`/`next start` — Next.js only enforces this origin check
  // in `next dev`.
  allowedDevOrigins: ['plaa.i.beandev.xyz', 'plaa.test'],
  sassOptions: {
    loadPaths: [__dirname, path.join(__dirname, 'styles')],
  },
  async redirects() {
    return [
      // {
      //   source: '/home',
      //   destination: '/',
      //   permanent: true,
      // },
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
      {
        source: '/signup',
        destination: '/sign-up',
        permanent: true,
      },
      {
        source: '/alignment-asset/rounds',
        destination: '/alignment-asset',
        permanent: true,
      },
      {
        source: '/pitch/:slug',
        destination: '/spotlight/:slug',
        permanent: true,
      },
    ];
  },
  env: {
    POSTHOG_KEY: process.env.POSTHOG_KEY,
    POSTHOG_HOST: process.env.POSTHOG_HOST,
    DIRECTORY_API_URL: process.env.DIRECTORY_API_URL,
    FORUM_API_URL: process.env.FORUM_API_URL,
    PROTOSPHERE_URL: process.env.PROTOSPHERE_URL,
    GET_SUPPORT_URL: process.env.GET_SUPPORT_URL,
    PRIVY_AUTH_ID: process.env.PRIVY_AUTH_ID,
    APPLICATION_BASE_URL: process.env.APPLICATION_BASE_URL,
    AUTH_API_URL: process.env.AUTH_API_URL,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    HUSKY_API_URL: process.env.HUSKY_API_URL,
    TEXT_EDITOR_API_KEY: process.env.TEXT_EDITOR_API_KEY,
    GOOGLE_SITE_KEY: process.env.GOOGLE_SITE_KEY,
    PRIORITY_FEATURED_SECTION: process.env.PRIORITY_FEATURED_SECTION,
    SCHEDULE_ENABLED_LOCATIONS: process.env.SCHEDULE_ENABLED_LOCATIONS,
    IRL_SUBMIT_FORM_URL: process.env.IRL_SUBMIT_FORM_URL,
    PL_EVENTS_BASE_URL: process.env.PL_EVENTS_BASE_URL,
    PL_EVENTS_SUBMISSION_URL: process.env.PL_EVENTS_SUBMISSION_URL,
    SCHEDULE_BASE_URL: process.env.SCHEDULE_BASE_URL,
    CUSTOM_FORUM_AUTH_TOKEN: process.env.CUSTOM_FORUM_AUTH_TOKEN,
    SCHEDULE_BASE_URL: process.env.SCHEDULE_BASE_URL,
    PLAA_API_URL: process.env.PLAA_API_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  productionBrowserSourceMaps: true,
};

// Upload the browser source maps to PostHog error tracking during `next build`,
// so minified frontend stack traces resolve to real component names. The wrap
// only runs when the build has a personal API key, so local and preview builds
// stay unchanged and never fail on a missing key. Set POSTHOG_PERSONAL_API_KEY
// (scopes: error tracking write, organization read) and POSTHOG_PROJECT_ID in
// the deploy environment.
export default process.env.POSTHOG_PERSONAL_API_KEY
  ? withPostHogConfig(nextConfig, {
      personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
      projectId: process.env.POSTHOG_PROJECT_ID,
      host: process.env.POSTHOG_HOST,
    })
  : nextConfig;
