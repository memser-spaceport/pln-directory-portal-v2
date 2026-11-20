/**
 * Security headers on every response (LAB-3094). CommonJS so both `next.config.mjs` and Jest can load it.
 *
 * - `X-Content-Type-Options: nosniff`: a response is only ever read as the type it declares.
 * - `Referrer-Policy: strict-origin-when-cross-origin`: other sites see our origin, never a profile's full URL.
 * - `X-Frame-Options: SAMEORIGIN` and `Content-Security-Policy: frame-ancestors 'self'`: no other site can frame a
 *   page but the events embed (below) (clickjacking, e.g. on the MCP consent page). Our own pages may still frame each other, as the AI Apps
 *   feedback capture and the design canvas do. The CSP carries only `frame-ancestors`: a full policy is out of scope
 *   while Privy and PostHog load from several origins.
 * - `Permissions-Policy`: turns off what the app never uses (camera, microphone, geolocation, payment, USB), for this
 *   page and anything it frames. Screen capture (AI Apps feedback), clipboard and fullscreen stay as they are.
 */
const BASE_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];
const FRAME_HEADERS = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
];

/**
 * The one page other sites may frame (LAB-3352): the All Events embed, which replaces the old events calendar on the
 * plrd.org focus area pages. Any https site may frame it (Vova, 2026-11-20): it is always the signed-out view, with
 * nothing to press that changes anything (an event opens LabOS in a new tab), and shows only what `/events/all` shows
 * anyone. Plain-http sites may not. No `X-Frame-Options`, which can't allow other sites and would override the CSP in
 * older browsers. Every other page keeps `SAMEORIGIN`.
 */
const EMBED_PATH = '/events/embed';
const EMBED_FRAME_ANCESTORS = ["'self'", 'https:'];
const EMBED_FRAME_HEADERS = [
  { key: 'Content-Security-Policy', value: `frame-ancestors ${EMBED_FRAME_ANCESTORS.join(' ')}` },
];

function securityHeaders() {
  return [
    { source: '/:path*', headers: BASE_HEADERS },
    // Every path but the embed (and anything under it); Next matches `source` against the whole path.
    { source: '/:path((?!events/embed(?:/|$)).*)', headers: FRAME_HEADERS },
    { source: EMBED_PATH, headers: EMBED_FRAME_HEADERS },
  ];
}

module.exports = { securityHeaders };
