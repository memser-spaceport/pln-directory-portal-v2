/**
 * Security headers on every response (LAB-3094). CommonJS so both `next.config.mjs` and Jest can load it.
 *
 * - `X-Content-Type-Options: nosniff`: a response is only ever read as the type it declares.
 * - `Referrer-Policy: strict-origin-when-cross-origin`: other sites see our origin, never a profile's full URL.
 * - `X-Frame-Options: SAMEORIGIN` and `Content-Security-Policy: frame-ancestors 'self'`: no other site can frame a
 *   page (clickjacking, e.g. on the MCP consent page). Our own pages may still frame each other, as the AI Apps
 *   feedback capture and the design canvas do. The CSP carries only `frame-ancestors`: a full policy is out of scope
 *   while Privy and PostHog load from several origins.
 * - `Permissions-Policy`: turns off what the app never uses (camera, microphone, geolocation, payment, USB), for this
 *   page and anything it frames. Screen capture (AI Apps feedback), clipboard and fullscreen stay as they are.
 */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];

function securityHeaders() {
  return [{ source: '/:path*', headers: SECURITY_HEADERS }];
}

module.exports = { securityHeaders, SECURITY_HEADERS };
