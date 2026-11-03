/**
 * The token that tells the directory API a request is this frontend's server reading it to render a page (LAB-3086).
 *
 * The API limits each client to 10 requests a second. Every visitor and crawler is rendered here, so their pages'
 * API reads all come from this server's few addresses: a crawler's burst came back as 429s, and healthy profiles
 * rendered the error page. With the token, the API lets these reads through; it keeps its limit for everyone else.
 *
 * Server only: `FRONTEND_RENDER_THROTTLE_TOKEN` has no `NEXT_PUBLIC_` prefix, so it never reaches the browser, and the
 * wrapper is installed from `instrumentation.ts`, which only the server runs. Sent only on reads (`GET`, `HEAD`) to
 * the API's own origin, which is all the API accepts it for.
 */
export const FRONTEND_RENDER_HEADER = 'x-frontend-render-token';

const READ_METHODS = new Set(['GET', 'HEAD']);
const INSTALLED = Symbol.for('pl.frontendRenderToken.installed');

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit];

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/**
 * The arguments for `fetch`, with the render token added when the request is a read of the API. Anything else, or no
 * token configured, comes back unchanged.
 */
export function withFrontendRenderToken(
  args: FetchArgs,
  { apiBase, token }: { apiBase: string | undefined; token: string | undefined },
): FetchArgs {
  const [input, init] = args;
  const apiOrigin = originOf(apiBase);
  if (!token || !apiOrigin || originOf(urlOf(input)) !== apiOrigin) {
    return args;
  }
  const request = typeof input === 'object' && 'method' in input ? input : undefined;
  const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
  if (!READ_METHODS.has(method)) {
    return args;
  }
  const headers = new Headers(init?.headers ?? request?.headers);
  if (headers.has(FRONTEND_RENDER_HEADER)) {
    return args;
  }
  headers.set(FRONTEND_RENDER_HEADER, token);
  return [input, { ...init, headers }];
}

/** Wraps the server's `fetch` once, so every read of the API carries the token, whichever service makes it. */
export function installFrontendRenderToken(target: typeof globalThis = globalThis): void {
  const holder = target as typeof globalThis & { [INSTALLED]?: boolean };
  if (holder[INSTALLED]) {
    return;
  }
  const original = target.fetch.bind(target);
  target.fetch = ((...args: FetchArgs) =>
    original(
      ...withFrontendRenderToken(args, {
        apiBase: process.env.DIRECTORY_API_URL,
        token: process.env.FRONTEND_RENDER_THROTTLE_TOKEN,
      }),
    )) as typeof fetch;
  holder[INSTALLED] = true;
}
