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

/** LAB-3298 (D1): `/home` (with `?…` or `#…`) becomes `/`, so a `/home?news=` link skips the 308 redirect. */
export const homeToRoot = (path: string) => path.replace(/^\/home\/?(?=[?#]|$)/, '/');

/**
 * The link of a C1 source ref. The backend sends `directoryLink` (a LabOS path) or `externalUrl` (backend PR #3754).
 * An older body or the mock sends `uid` for news or `url`; they stay as a fallback. `external` opens a new tab.
 */
export function sourceRefLink(ref: LabosAgentSourceRef): { href?: string; external: boolean } {
  if (isDirectoryPath(ref.directoryLink)) return { href: homeToRoot(ref.directoryLink), external: false };
  // LAB-3298 (D1): a full URL on the app's own origin is a LabOS path, so the panel opens it in the same tab.
  const ownPath = ownOriginPath(ref.directoryLink) ?? ownOriginPath(ref.externalUrl);
  if (ownPath) return { href: homeToRoot(ownPath), external: false };
  if (isWebUrl(ref.externalUrl)) return { href: ref.externalUrl.trim(), external: true };
  if (ref.type === 'news' && ref.uid) return { href: `/?news=${encodeURIComponent(ref.uid)}`, external: false };
  if (isWebUrl(ref.url)) return { href: ref.url.trim(), external: true };
  return { external: false };
}

/** The ref types that are a web page, not a LabOS item. The backend sends `external`; an older body sends `web`. */
const WEB_REF_TYPES = new Set(['external', 'web']);

/** LAB-3297 V0-R7: the `sourceType` of `agent-source-clicked` for a C1 ref. Type `external` (or `web`) is `web`. */
export const sourceRefKind = (ref: LabosAgentSourceRef): 'labos' | 'web' =>
  WEB_REF_TYPES.has(ref.type.trim().toLowerCase()) ? 'web' : 'labos';

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

/** The label under "Sources" for each C1 ref type. An unknown type shows with a capital first letter. */
const REF_TYPE_LABELS: Record<string, string> = {
  news: 'LabOS news',
  team: 'Team',
  project: 'Project',
  member: 'Member',
  external: 'Web',
  web: 'Web',
};

/** The host of a URL with no `www.`, or `null` when it is not a URL. */
const hostOf = (url: string): string | null => {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
};

/**
 * LAB-3298 (D8): the title and the label of a C1 ref under "Sources". A LabOS type shows as a word ("Team"), never
 * the raw type. A web ref (`external` or `web`) shows "Web" as the label. It keeps a real page title (`searchWeb` refs
 * carry one). Only when the title is empty or is a URL (`external` refs carry the URL) does it show the domain.
 */
export function sourceRefLabel(ref: LabosAgentSourceRef): { title: string; meta: string } {
  const type = ref.type.trim().toLowerCase();
  const meta = REF_TYPE_LABELS[type] ?? (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'LabOS');
  if (meta !== 'Web') return { title: ref.title, meta };
  const { href, external } = sourceRefLink(ref);
  if (!titleIsUrl(ref.title)) return { title: ref.title, meta };
  return { title: (external && href && hostOf(href)) || ref.title, meta };
}

/** True when a ref title is empty or is a URL (`https://…`, `http://…` or `www.…`, with no spaces). */
const titleIsUrl = (title: string | undefined) => {
  const t = (title ?? '').trim();
  return !t || /^(https?:\/\/|www\.)\S*$/i.test(t);
};
