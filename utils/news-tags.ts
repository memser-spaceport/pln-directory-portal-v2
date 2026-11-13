/**
 * A member's news tags (LAB-2998, LAB-3000): focus-area slugs. The backend
 * returns `newsTagsSeeded: true` while the member has never saved tags; the
 * list is then their teams' focus areas, and the first save stores it.
 */
export interface MemberNewsTags {
  newsTags: string[];
  newsTagsSeeded: boolean;
}

/** The news tags in a raw preferences response; a missing list reads as none. */
export function readNewsTags(raw: unknown): MemberNewsTags {
  const value = (raw ?? {}) as { newsTags?: unknown; newsTagsSeeded?: unknown };
  const newsTags = Array.isArray(value.newsTags)
    ? value.newsTags.filter((tag): tag is string => typeof tag === 'string')
    : [];
  return { newsTags, newsTagsSeeded: value.newsTagsSeeded === true };
}

const NEWS_CATEGORY_TAG_VALUES = new Set(['FUNDING', 'LAUNCH', 'ANNOUNCEMENT']);

/** Saved category tags (LAB-3140). A missing list reads as none. */
export function readNewsCategoryTags(raw: unknown): string[] {
  const stored = (raw as { newsCategoryTags?: unknown } | null | undefined)?.newsCategoryTags;
  if (!Array.isArray(stored)) return [];
  return stored.filter((tag): tag is string => typeof tag === 'string' && NEWS_CATEGORY_TAG_VALUES.has(tag));
}
