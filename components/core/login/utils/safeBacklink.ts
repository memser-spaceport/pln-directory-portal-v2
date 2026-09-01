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
  try {
    const base = new URL(process.env.APPLICATION_BASE_URL || 'http://localhost');
    // Resolve relative to base rather than special-casing a leading '/' —
    // a bare startsWith('/') check also matches protocol-relative strings
    // like '//evil.com', which browsers navigate as https://evil.com.
    const target = new URL(raw, base);

    if (target.protocol !== base.protocol) return null;
    if (target.hostname === base.hostname || target.hostname.endsWith(`.${base.hostname}`)) {
      return target.toString();
    }
  } catch {
    return null;
  }

  return null;
}
