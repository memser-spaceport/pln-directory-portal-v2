/**
 * Routes that require authentication. Users accessing these without a valid
 * session are redirected to login (see proxy.ts).
 */
export const PROTECTED_ROUTES = ['/deals/', '/founder-guides', '/investors'];

/** Matched on a path boundary, so a sibling like /alignment-asset-x is not gated. */
export const PLAA_SECTION = '/alignment-asset';

export function isProtectedRoute(pathname: string): boolean {
  if (pathname === PLAA_SECTION || pathname.startsWith(`${PLAA_SECTION}/`)) return true;
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}
