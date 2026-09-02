/**
 * Routes that require authentication. Users accessing these without a valid
 * session are redirected to login (see proxy.ts).
 */
export const PROTECTED_ROUTES = ['/deals/', '/founder-guides', '/investors', '/alignment-asset/'];

export function isProtectedRoute(pathname: string): boolean {
  // The bare section root has no trailing slash to match against '/alignment-asset/'.
  if (pathname === '/alignment-asset') return true;
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}
