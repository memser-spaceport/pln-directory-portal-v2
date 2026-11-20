import type { LabosAgentSourceRef } from '@/types/labos-agent.types';

/** A LabOS path: one leading `/`, not `//` (another host). */
const isDirectoryPath = (v: unknown): v is string => typeof v === 'string' && v.startsWith('/') && !v.startsWith('//');

/** An `http` or `https` URL. Other schemes (`javascript:`, `data:`) never become a link. */
const isWebUrl = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//i.test(v.trim());

/** The path, query and hash of an `http(s)` URL on the app's own origin. `null` for another origin or no URL. */
export function ownOriginPath(v: unknown): string | null {
  if (!isWebUrl(v) || typeof window === 'undefined') return null;
  try {
    const url = new URL(v.trim());
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : null;
  } catch {
    return null;
  }
}

/**
 * The link of a C1 source ref. The backend sends `directoryLink` (a LabOS path) or `externalUrl` (backend PR #3754).
 * An older body or the mock sends `uid` for news or `url`; they stay as a fallback. `external` opens a new tab.
 */
export function sourceRefLink(ref: LabosAgentSourceRef): { href?: string; external: boolean } {
  if (isDirectoryPath(ref.directoryLink)) return { href: ref.directoryLink, external: false };
  // LAB-3298 (D1): a full URL on the app's own origin is a LabOS path, so the panel opens it in the same tab.
  const ownPath = ownOriginPath(ref.directoryLink) ?? ownOriginPath(ref.externalUrl);
  if (ownPath) return { href: ownPath, external: false };
  if (isWebUrl(ref.externalUrl)) return { href: ref.externalUrl.trim(), external: true };
  if (ref.type === 'news' && ref.uid) return { href: `/?news=${encodeURIComponent(ref.uid)}`, external: false };
  if (isWebUrl(ref.url)) return { href: ref.url.trim(), external: true };
  return { external: false };
}

/** One key for a link: trimmed, with no trailing slash. The same rule as the backend `answerCounts`. */
const linkKey = (url: string) => url.trim().replace(/\/+$/, '');

/**
 * LAB-3297 V0-R4 fallback: the number of distinct sources when C1 sends no `sourceCount`. A page in both lists, or
 * twice in one list, counts once. A ref with no link counts by type and title. It follows the backend `answerCounts`
 * (PR #3754).
 */
export function distinctSourceCount(sources: string[], sourceRefs: LabosAgentSourceRef[]): number {
  const keys = new Set<string>();
  for (const ref of sourceRefs) {
    const link = ref.externalUrl || ref.directoryLink || sourceRefLink(ref).href;
    keys.add(link ? linkKey(link) : `${ref.type}:${ref.title}`);
  }
  for (const url of sources) if (url.trim()) keys.add(linkKey(url));
  return keys.size;
}
