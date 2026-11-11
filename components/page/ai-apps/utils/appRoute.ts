/**
 * Deep links for an embedded AI App: the app's open subpage lives in the LabOS
 * URL after the page's base path (`/pl-infra-os/flywheels` → `/flywheels`), and
 * the app reports its in-app navigation back so the address bar follows it.
 * Shared by every page that embeds an app; all validation lives here.
 */

/**
 * Sent by the embedded app (starter kit ≥1.10) on load and on every in-app
 * navigation: `{ type, path, title }`. The frame is cross-origin, so this is
 * the only way to learn which subpage is open. Kits ≥1.14 send pathname +
 * query (never the hash), addressed to this origin. Kits 1.12–1.13 sent the
 * pathname only; kits 1.10–1.11 sent pathname + query + hash to `'*'`. The
 * listener drops the hash, reserved portal params, and secret-like query keys
 * no matter what the sender included.
 */
const APP_ROUTE_MESSAGE = 'pln-ai-app:route';
const MAX_APP_PATH_LENGTH = 2048;
const MAX_APP_TITLE_LENGTH = 200;

/**
 * Portal-owned keys on this page's query string. They stay on the parent URL
 * and are never forwarded into the iframe (`?settings=deployment` opens a
 * LabOS modal; `path` is the legacy deep-link param; `feedback=<uid>` opens
 * that feedback's pins on the page).
 */
const RESERVED_PORTAL_PARAMS = new Set(['settings', 'path', 'feedback']);

/**
 * Exact, case-insensitive. These names are where OAuth callbacks (`?code=`),
 * magic links and tokens land — they must not be mirrored into a shareable
 * URL or replayed as the iframe's initial query. `state` is ordinary UI state
 * in apps, so it is not listed.
 */
const DENIED_APP_PARAMS = new Set([
  'code',
  'token',
  'access_token',
  'id_token',
  'refresh_token',
  'secret',
  'client_secret',
  'key',
  'api_key',
  'apikey',
  'auth',
  'authorization',
  'password',
  'passwd',
  'pwd',
  'jwt',
  'bearer',
  'otp',
]);

function isReservedPortalParam(key: string): boolean {
  return RESERVED_PORTAL_PARAMS.has(key.toLowerCase());
}

function isDeniedAppParam(key: string): boolean {
  return DENIED_APP_PARAMS.has(key.toLowerCase());
}

/** App-owned query string: reserved portal keys and the secret denylist are dropped. */
function filterAppSearch(params: URLSearchParams): string {
  const kept = new URLSearchParams();
  for (const [key, value] of params) {
    if (isReservedPortalParam(key) || isDeniedAppParam(key)) continue;
    kept.append(key, value);
  }
  const qs = kept.toString();
  return qs ? `?${qs}` : '';
}

// Accepts only a path on the app's own origin; the origin comparison rejects
// `//host`, absolute URLs, backslashes and non-http schemes in one go.
// Returns pathname + safe query. The hash is never kept.
export function resolveAppPath(appOrigin: string, raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw || raw.length > MAX_APP_PATH_LENGTH) return null;
  try {
    const url = new URL(raw, appOrigin);
    if (url.origin !== appOrigin) return null;
    const path = `${url.pathname}${filterAppSearch(url.searchParams)}`;
    if (path.length > MAX_APP_PATH_LENGTH) return null;
    return path;
  } catch {
    return null;
  }
}

/** Pathname segment plus the query captured on first load, if either is present. */
export function initialAppRoute(path: string | null, search: string): string | null {
  if (!path && !search) return null;
  return `${path ?? '/'}${search}`;
}

/**
 * Parent query after a route report: the app's filtered params, then reserved
 * portal params copied from the current address bar so they win and survive
 * an in-app navigation that reports no query.
 */
function parentSearchForAppRoute(appPath: string): string {
  const merged = new URLSearchParams(new URL(appPath, 'https://placeholder.invalid').search);
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    if (isReservedPortalParam(key)) merged.append(key, value);
  }
  const qs = merged.toString();
  return qs ? `?${qs}` : '';
}

export function mirroredAppUrl(basePath: string, appPath: string): string {
  const queryAt = appPath.indexOf('?');
  const appPathname = queryAt === -1 ? appPath : appPath.slice(0, queryAt);
  const segment = appPathname === '/' ? '' : appPathname;
  return `${basePath}${segment}${parentSearchForAppRoute(appPath)}`;
}

export interface AppRouteReport {
  /** Pathname + safe query on the app's origin; null when the reported path is not one. */
  path: string | null;
  title: string | null;
}

/**
 * A route report from the embedded app, or null for any other message. Only
 * the app's own origin AND the page's own frame are listened to.
 */
export function readAppRouteMessage(
  event: MessageEvent,
  appOrigin: string,
  frameWindow: Window | null | undefined,
): AppRouteReport | null {
  if (event.origin !== appOrigin || event.source !== frameWindow) return null;
  if (event.data?.type !== APP_ROUTE_MESSAGE) return null;

  const title = typeof event.data.title === 'string' ? event.data.title.trim().slice(0, MAX_APP_TITLE_LENGTH) : '';
  return { path: resolveAppPath(appOrigin, event.data.path), title: title || null };
}

/**
 * A pasted link can already carry `?code=` / `?token=`. Drop those before the
 * app reports a route so they don't sit in the address bar.
 */
export function dropDeniedAppParamsFromAddressBar(): void {
  const params = new URLSearchParams(window.location.search);
  let removed = false;
  for (const key of [...params.keys()]) {
    if (!isDeniedAppParam(key)) continue;
    params.delete(key);
    removed = true;
  }
  if (!removed) return;
  const qs = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}
