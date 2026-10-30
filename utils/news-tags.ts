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
