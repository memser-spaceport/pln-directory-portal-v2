/**
 * Routes that require authentication. Users accessing these without a valid
 * session are redirected to login (see proxy.ts).
 */
export const PROTECTED_ROUTES = ['/deals/', '/founder-guides', '/investors', '/pl-infra-os', '/alignment-asset'];

/**
 * AI Apps sub-paths that deliberately show their own signed-out state instead
 * of being gated here (the connect flow needs to work for a guest mid-approval,
 * and feedback submission has its own access messaging).
 */
const AI_APPS_PUBLIC_ROUTES = ['/pl-infra/ai-apps/connect', '/pl-infra/ai-apps/feedback'];

export const PLAA_PUBLIC_EXACT_PATHS = ['/alignment-asset'];

function isPlaaRoute(pathname: string): boolean {
  return pathname === '/alignment-asset' || pathname.startsWith('/alignment-asset/');
}

export function isAiAppsRoute(pathname: string): boolean {
  return (
    pathname === '/pl-infra/ai-apps' || pathname.startsWith('/pl-infra/ai-apps/') || pathname.startsWith('/pl-infra-os')
  );
}

export function isProtectedRoute(pathname: string): boolean {
  if (isPlaaRoute(pathname)) {
    return !PLAA_PUBLIC_EXACT_PATHS.includes(pathname.replace(/\/$/, ''));
  }
  if (isAiAppsRoute(pathname)) {
    return !AI_APPS_PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  }
  return PROTECTED_ROUTES.some((route) =>
    route.endsWith('/') ? pathname.startsWith(route) : pathname === route || pathname.startsWith(`${route}/`),
  );
}
