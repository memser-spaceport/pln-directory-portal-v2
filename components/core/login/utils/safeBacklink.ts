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
    return raw;
  }

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
