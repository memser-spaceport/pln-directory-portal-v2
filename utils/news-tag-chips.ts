import type { INewsFocusArea } from '@/types/team-news.types';

/**
 * Legacy verb tags (LAB-3003): the backend's BOOST_PATTERNS tags in
 * `apps/web-api/src/scripts/dorothea/classify.ts`. Never shown as a chip.
 */
export const NEWS_VERB_TAGS: ReadonlySet<string> = new Set([
  '$',
  'raise',
  'launch',
  'announce',
  'acquire',
  'partner',
  'fund',
  'deploy',
  'win',
  'join',
  'publish',
  'grant',
  'integrate',
  'pilot',
  'release',
  'scale',
]);

/** Up to this many topic chips on a Home feed row or a Top stories card. */
export const NEWS_CARD_TOPIC_LIMIT = 3;

/**
 * A focus area's tag slug, exactly as the backend writes news tags: a copy of
 * `slugify` in `apps/web-api/src/utils/helper/helper.ts`. Spaces become `-`,
 * other non-word characters are dropped (not turned into `-`), so "VR/AR" is
 * `vrar` and "AI & Robotics" is `ai-robotics`. Keep the two in step: any
 * difference hides that focus area's chips.
 */
export function focusAreaSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/** Slugs of the top two levels of focus areas (roots and their direct children). */
export function getNewsTopicSlugs(focusAreas: readonly INewsFocusArea[]): string[] {
  const rootUids = new Set(focusAreas.filter((area) => !area.parentUid).map((area) => area.uid));
  const slugs = focusAreas
    .filter((area) => !area.parentUid || rootUids.has(area.parentUid))
    .map((area) => focusAreaSlug(area.title))
    .filter(Boolean);
  return Array.from(new Set(slugs));
}

export interface NewsTagChipOptions {
  /** Also return the free-form extras (tags that are not topics), after the topics. The detail modal sets it. */
  withExtras?: boolean;
  /** At most this many topics. */
  topicLimit?: number;
}

/**
 * The tags to show as chips, in the item's tag order: topics first, then (with
 * `withExtras`) the free-form extras. Verb tags, empty tags and repeats are dropped.
 */
export function getNewsTagChips(
  tags: readonly string[] | null | undefined,
  topicSlugs: ReadonlySet<string>,
  { withExtras = false, topicLimit }: NewsTagChipOptions = {},
): string[] {
  const seen = new Set<string>();
  const topics: string[] = [];
  const extras: string[] = [];
  for (const raw of tags ?? []) {
    const tag = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    if (!tag || seen.has(tag) || NEWS_VERB_TAGS.has(tag)) continue;
    seen.add(tag);
    (topicSlugs.has(tag) ? topics : extras).push(tag);
  }
  const shownTopics = topicLimit === undefined ? topics : topics.slice(0, topicLimit);
  return withExtras ? [...shownTopics, ...extras] : shownTopics;
}

/** A tag as the chips show it and the feed filter compares it: trimmed, lower-case. */
export function normalizeNewsTag(tag: string): string {
  return tag.trim().toLowerCase();
}

/** True when the item carries `tag` exactly (after normalizing) — the Home feed's tag filter (LAB-3010). */
export function newsItemHasTag(item: { tags?: readonly string[] | null }, tag: string): boolean {
  const wanted = normalizeNewsTag(tag);
  return (item.tags ?? []).some((t) => typeof t === 'string' && normalizeNewsTag(t) === wanted);
}
