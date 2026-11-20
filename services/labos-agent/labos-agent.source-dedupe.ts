import type { LabosAgentSourceRef } from '@/types/labos-agent.types';

/** The origin of the app, or `null` on the server. */
const appOrigin = () => (typeof window === 'undefined' ? null : window.location.origin);

/** A host with no `www.`, in lower case. */
const bareHost = (host: string) => host.toLowerCase().replace(/^www\./, '');

/**
 * One compare key for a link: the host with no `www.`, the path with no trailing slash, and the query. The hash
 * drops out. A relative link reads against the app origin. `null` when the value is not a link.
 */
export function sourceLinkKey(link: unknown): string | null {
  if (typeof link !== 'string' || !link.trim()) return null;
  const value = link.trim();
  const relative = value.startsWith('/') && !value.startsWith('//');
  const base = appOrigin();
  if (relative && !base) return `/${value.replace(/^\/+/, '').replace(/\/+$/, '')}`;
  try {
    const url = new URL(value, base ?? undefined);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const path = url.pathname.replace(/\/+$/, '');
    return `${bareHost(url.host)}${path}${url.search}`;
  } catch {
    return null;
  }
}

/** True when the link is on the app's own host (with or without `www.`). */
const isOwnHost = (link: string) => {
  const base = appOrigin();
  if (!base) return false;
  try {
    return bareHost(new URL(link).host) === bareHost(new URL(base).host);
  } catch {
    return false;
  }
};

/**
 * LAB-3298 (D2): the web sources that the panel shows under "Sources". It is a guard; the backend fix is the main
 * fix. A web source drops out when a C1 ref already points to the same page (`externalUrl`, `directoryLink` or
 * `url`, full or relative, with or without `www.` and a trailing slash), when it is on the app's own origin, or when
 * it comes twice. The order stays.
 */
export function visibleWebSources(sources: string[], sourceRefs: LabosAgentSourceRef[]): string[] {
  const seen = new Set<string>();
  for (const ref of sourceRefs) {
    for (const link of [ref.externalUrl, ref.directoryLink, ref.url]) {
      const key = sourceLinkKey(link);
      if (key) seen.add(key);
    }
    if (ref.type === 'news' && ref.uid) {
      const key = sourceLinkKey(`/?news=${encodeURIComponent(ref.uid)}`);
      if (key) seen.add(key);
    }
  }
  return sources.filter((url) => {
    const key = sourceLinkKey(url);
    if (!key || seen.has(key) || isOwnHost(url.trim())) return false;
    seen.add(key);
    return true;
  });
}
