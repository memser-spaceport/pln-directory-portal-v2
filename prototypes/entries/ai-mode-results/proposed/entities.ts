import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { CORPUS, type CorpusItem, type DirectoryHit } from '../../ai-search/mocks';

/**
 * What the proposed answer needs to know about a link or a hit, read off the
 * mocked corpus. Everything here is lookup, no new data: a directory URL
 * resolves to the record it names, and the record supplies the picture, the
 * type word and whether the person has office hours.
 */

export type EntityType = DirectoryHit['type'];

export const TYPE_LABEL: Record<EntityType, string> = {
  member: 'Member',
  team: 'Team',
  project: 'Project',
  event: 'Event',
};

/* Production's own "no picture yet" marks (same set DirectoryResultsCards uses). */
const FALLBACK_LOGO: Record<Exclude<EntityType, 'member'>, string> = {
  team: '/icons/team-default-profile.svg',
  project: '/icons/project-default.svg',
  event: '/icons/irl-event-default-logo.svg',
};

const INDEX_TYPE: Record<CorpusItem['index'], EntityType> = {
  members: 'member',
  teams: 'team',
  projects: 'project',
  events: 'event',
};

export const pictureOf = (type: EntityType, name: string, avatar?: string) =>
  avatar ?? (type === 'member' ? getDefaultAvatar(name) : FALLBACK_LOGO[type]);

/** `/teams/lumen-storage` or `https://directory…/teams/lumen-storage` → the record. */
export function recordFor(href: string): CorpusItem | undefined {
  let path = href;
  try {
    path = new URL(href, 'https://directory.plnetwork.io').pathname;
  } catch {
    /* keep as is */
  }
  const [index, uid] = path.split('/').filter(Boolean);
  return CORPUS.find((c) => c.uid === uid && c.index === index) ?? CORPUS.find((c) => c.eventUrl === href);
}

export interface Mention {
  name: string;
  type: EntityType;
  picture: string;
}

export function mentionFor(href: string): Mention | null {
  const rec = recordFor(href);
  if (!rec) return null;
  const type = INDEX_TYPE[rec.index];
  return { name: rec.name, type, picture: pictureOf(type, rec.name) };
}

/** Whether a member hit has office hours open — production's "Available to connect". */
export const isAvailable = (hit: DirectoryHit) => hit.type === 'member' && !!recordFor(hit.source)?.availableToConnect;

/* ------------------------------------------------------------------------ */
/* Source refs and inline citations                                           */
/* ------------------------------------------------------------------------ */

/**
 * Production's wire shape for a cited source (`huskySourceRefSchema` in
 * services/husky/hooks/useHuskyChat.ts): the answer text carries `[n](url)`
 * links and `sourceRefs` names each n. Production's `Markdown` already turns
 * those into blue "[1]" text links; nothing styles them.
 *
 * The mocked answers predate that shape (bare `sources: string[]`), so the
 * refs are derived here: one per source URL, titled from the record it points
 * at, numbered in order.
 */
export interface SourceRef {
  index: number;
  title: string;
  type: string;
  href: string;
  /** "Team · directory.plnetwork.io", or the host for an external page. */
  origin: string;
  picture?: string;
}

export function sourceRefsFor(sources: string[]): SourceRef[] {
  return sources.map((href, i) => {
    const rec = recordFor(href);
    let host = href;
    try {
      host = new URL(href).hostname.replace(/^www\./, '');
    } catch {
      /* keep */
    }
    if (rec) {
      const type = INDEX_TYPE[rec.index];
      return {
        index: i + 1,
        title: rec.name,
        type: TYPE_LABEL[type],
        href,
        origin: `${TYPE_LABEL[type]} · ${host}`,
        picture: pictureOf(type, rec.name),
      };
    }
    return { index: i + 1, title: host, type: 'Web', href, origin: host };
  });
}

/**
 * Puts each `[n](url)` marker where production's backend puts it: at the end
 * of the sentence that first mentions the source. Mock-only — real answers
 * arrive with the markers already in the text. A source no sentence links to
 * (the Lisbon events' organiser sites) is still listed under Sources, uncited
 * in the prose, which is also what happens in production.
 */
export function withCitations(markdown: string, refs: SourceRef[]): string {
  /* Positions are found on the untouched text, then inserted back to front, so
     two refs that close the same sentence land side by side ("…data.[1][2]"). */
  const at = new Map<number, string>();
  for (const ref of refs) {
    const rec = recordFor(ref.href);
    if (!rec) continue;
    const link = markdown.indexOf(`](/${rec.index}/${rec.uid})`);
    if (link < 0) continue;
    /* The sentence's terminator: ". " / "." at the end, ":" — or the line's end. */
    const rest = markdown.slice(link);
    const stops = [rest.search(/[.:](\s|$)/), rest.indexOf('\n')].filter((n) => n >= 0);
    /* Mid-stream the sentence may not have ended yet: the marker waits for it. */
    if (!stops.length) continue;
    const stop = link + Math.min(...stops);
    /* After the terminator (".[1]"), so the number follows the sentence it backs. */
    const pos = /[.:]/.test(markdown[stop] ?? '') ? stop + 1 : stop;
    at.set(pos, (at.get(pos) ?? '') + `[${ref.index}](${ref.href})`);
  }
  let out = markdown;
  Array.from(at.keys())
    .sort((a, b) => b - a)
    .forEach((pos) => {
      out = out.slice(0, pos) + at.get(pos) + out.slice(pos);
    });
  return out;
}
