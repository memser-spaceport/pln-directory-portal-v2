// Any well-formed placeholder works — used only to ask the URL parser "does
// raw resolve to a different host than whatever it's resolved against",
// never to build the value we actually return.
const RELATIVE_PATH_PROBE_BASE = 'https://placeholder.invalid';

/**
 * Validates a post-login `backlink` redirect target before it's ever used to
 * navigate the browser. Accepts a same-origin relative path (the original,
 * long-standing rule — see PrivyModals' loginUser) or an absolute URL on
 * this portal's own host or a subdomain of it (covers a deployed AI App's
 * own origin, e.g. `<appId>.dev.plnetwork.io` when the portal itself is
 * `dev.plnetwork.io`). Anything else is rejected to avoid turning `backlink`
 * into an open redirect.
 */
export function getSafeBacklinkTarget(raw: string): string | null {
  if (raw.startsWith('/')) {
    // A genuine same-origin relative path resolves (via the URL parser,
    // which also strips C0 control chars like tabs/newlines per the WHATWG
    // spec) to the SAME host as whatever it's probed against; a
    // protocol-relative ('//host'), backslash, or control-character variant
    // resolves to a DIFFERENT host — reject those. Returns raw as-is (not
    // the probe-resolved URL) so it resolves against whatever origin is
    // actually serving the page, not against APPLICATION_BASE_URL below,
    // which can be stale/misconfigured independently of the real origin.
    try {
      const resolved = new URL(raw, RELATIVE_PATH_PROBE_BASE);
      return resolved.hostname === new URL(RELATIVE_PATH_PROBE_BASE).hostname ? raw : null;
    } catch {
      return null;
    }
  }

  // Otherwise it must be a genuine absolute URL on this portal's own host or
  // a subdomain of it (covers a deployed AI App's own origin, e.g.
  // <appId>.dev.plnetwork.io when the portal itself is dev.plnetwork.io).
  try {
    const target = new URL(raw);
    const base = new URL(process.env.APPLICATION_BASE_URL || 'http://localhost');

    if (target.protocol !== base.protocol) return null;
    if (target.hostname === base.hostname || target.hostname.endsWith(`.${base.hostname}`)) {
      return target.toString();
    }
  } catch {
    return null;
  }

  return null;
}
