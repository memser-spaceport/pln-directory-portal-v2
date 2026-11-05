import type { HuskySourceRef } from '@/services/husky/hooks/useHuskyChat';

/** `directory`: a page in the directory. `web`: a public web page (a `web` or `external` ref with no directory page). */
export type SourceKind = 'directory' | 'web';

export interface SourceItem {
  key: string;
  href: string;
  title: string;
  kind: SourceKind;
}

export interface SourceGroup {
  kind: SourceKind;
  label: 'Directory' | 'Web';
  items: SourceItem[];
}

const WEB_REF_TYPES = new Set(['web', 'external']);

const INLINE_MARKER = /\[(?:Team|Member|Project|Event|Job|News|Forum|Investor|WarmIntro)Link\]\(([^)]+)\)/g;

function inlineMarkers(title: string) {
  return [...title.matchAll(new RegExp(INLINE_MARKER.source, 'g'))];
}

function cleanSegment(raw: string): string {
  return raw
    .replace(/^[\s,;]+/, '')
    .replace(/^(?:and|or)\s+/i, '')
    .replace(/^(Teams|Team|Projects|Project|Members|Member|Topic|Name|Title):\s*/i, '')
    .trim();
}

function isSingleHref(href: string): boolean {
  return /^(\/|https?:\/\/)/.test(href) && !/[\s[]/.test(href);
}

function nameBefore(title: string, markerIndex: number, previousEnd: number): string {
  return cleanSegment(title.slice(previousEnd, markerIndex));
}

function itemsFromInlineMarkers(item: SourceItem): SourceItem[] {
  const matches = inlineMarkers(item.title);
  if (!matches.length) return [item];

  if (isSingleHref(item.href)) {
    const last = matches[matches.length - 1];
    const after = cleanSegment(item.title.slice((last.index ?? 0) + last[0].length));
    if (after) return [{ ...item, title: after }];

    let previousEnd = 0;
    for (const match of matches) {
      const link = match[1].trim();
      if (link === item.href || item.href.endsWith(link)) {
        const name = nameBefore(item.title, match.index ?? 0, previousEnd);
        return [{ ...item, title: name || item.href }];
      }
      previousEnd = (match.index ?? 0) + match[0].length;
    }
    return [item];
  }

  let previousEnd = 0;
  return matches.map((match, index) => {
    const link = match[1].trim();
    const name = nameBefore(item.title, match.index ?? 0, previousEnd);
    previousEnd = (match.index ?? 0) + match[0].length;
    return { key: `${item.key}-${index}`, href: link, title: name || link, kind: kindOfHref(link) };
  });
}

function kindOfHref(href: string): SourceKind {
  return href.startsWith('/') ? 'directory' : 'web';
}

function kindOfRef(ref: HuskySourceRef): SourceKind {
  return !ref.directoryLink && WEB_REF_TYPES.has(ref.type) ? 'web' : 'directory';
}

export function sourceItems(sources: string[] | undefined, sourceRefs: HuskySourceRef[] | undefined): SourceItem[] {
  const raw = sourceRefs?.length
    ? sourceRefs.flatMap((ref) => {
        const href = ref.directoryLink || ref.externalUrl;
        if (!href) {
          return [];
        }
        return [{ key: String(ref.index), href, title: ref.title || href, kind: kindOfRef(ref) }];
      })
    : (sources ?? []).map((source, index) => ({
        key: String(index),
        href: source,
        title: source,
        kind: kindOfHref(source),
      }));

  return raw.flatMap(itemsFromInlineMarkers);
}

/** Directory sources first, then web sources. A group with no sources is left out. */
export function groupSourceItems(items: SourceItem[]): SourceGroup[] {
  const groups: SourceGroup[] = [
    { kind: 'directory', label: 'Directory', items: items.filter((item) => item.kind === 'directory') },
    { kind: 'web', label: 'Web', items: items.filter((item) => item.kind === 'web') },
  ];
  return groups.filter((group) => group.items.length > 0);
}

/** The counts that `unified-search-ai-web-sources-shown` sends. */
export function sourceCounts(items: SourceItem[]) {
  const webSources = items.filter((item) => item.kind === 'web').length;
  return { webSources, directorySources: items.length - webSources };
}
