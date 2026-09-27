/**
 * Routes that require authentication. Users accessing these without a valid
 * session are redirected to login (see proxy.ts).
 */
export const PROTECTED_ROUTES = ['/deals/', '/founder-guides', '/investors', '/pl-infra-os', '/alignment-asset'];

/**
 * The PLAA home page is the program's public front door: PLAA-94 requires it to
 * render for visitors who are not signed in or not onboarded, and its "Get
 * started" eligibility modal exists for exactly those people. Gating it sent
 * every prospect to the login screen instead. Only the bare route is public —
 * every /alignment-asset/* sub-page stays protected.
 */
const PUBLIC_EXACT_ROUTES = ['/alignment-asset'];

/**
 * AI Apps sub-paths that deliberately show their own signed-out state instead
 * of being gated here (the connect flow needs to work for a guest mid-approval,
 * and feedback submission has its own access messaging).
 */
const AI_APPS_PUBLIC_ROUTES = ['/pl-infra/ai-apps/connect', '/pl-infra/ai-apps/feedback'];

export function isAiAppsRoute(pathname: string): boolean {
  return (
    pathname === '/pl-infra/ai-apps' || pathname.startsWith('/pl-infra/ai-apps/') || pathname.startsWith('/pl-infra-os')
  );
}

export function isProtectedRoute(pathname: string): boolean {
  if (PUBLIC_EXACT_ROUTES.includes(pathname.replace(/\/$/, ''))) return false;

  if (isAiAppsRoute(pathname)) {
    return !AI_APPS_PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  }
  return PROTECTED_ROUTES.some((route) =>
    route.endsWith('/') ? pathname.startsWith(route) : pathname === route || pathname.startsWith(`${route}/`),
  );
}
