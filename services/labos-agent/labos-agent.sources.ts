import type { LabosAgentSourceRef } from '@/types/labos-agent.types';

/** A LabOS path: one leading `/`, not `//` (another host). */
const isDirectoryPath = (v: unknown): v is string => typeof v === 'string' && v.startsWith('/') && !v.startsWith('//');

/** An `http` or `https` URL. Other schemes (`javascript:`, `data:`) never become a link. */
const isWebUrl = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//i.test(v.trim());

/**
 * The link of a C1 source ref. The backend sends `directoryLink` (a LabOS path) or `externalUrl` (backend PR #3754).
 * An older body or the mock sends `uid` for news or `url`; they stay as a fallback. `external` opens a new tab.
 */
export function sourceRefLink(ref: LabosAgentSourceRef): { href?: string; external: boolean } {
  if (isDirectoryPath(ref.directoryLink)) return { href: ref.directoryLink, external: false };
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
 * the raw type. A web ref (`external` or `web`) shows its domain as the title and "Web" as the label, like the web
 * sources of the answer.
 */
export function sourceRefLabel(ref: LabosAgentSourceRef): { title: string; meta: string } {
  const type = ref.type.trim().toLowerCase();
  const meta = REF_TYPE_LABELS[type] ?? (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'LabOS');
  if (meta !== 'Web') return { title: ref.title, meta };
  const { href, external } = sourceRefLink(ref);
  return { title: (external && href && hostOf(href)) || ref.title, meta };
}
