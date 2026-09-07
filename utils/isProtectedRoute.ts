/**
 * Routes that require authentication. Users accessing these without a valid
 * session are redirected to login (see proxy.ts).
 */
export const PROTECTED_ROUTES = ['/deals/', '/founder-guides', '/investors', '/alignment-asset'];

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) =>
    route.endsWith('/') ? pathname.startsWith(route) : pathname === route || pathname.startsWith(`${route}/`),
  );
}
