/**
 * Routes that render as a standalone document/viewer with no site chrome
 * (navbar, banners, bottom nav) — e.g. the full-page AI App PRD viewer,
 * meant to feel like opening a file in its own tab.
 */
const BARE_ROUTE_PATTERNS = [/^\/pl-infra\/ai-apps\/[^/]+\/prd\/?$/];

export function isBareRoute(pathname: string): boolean {
  return BARE_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}
