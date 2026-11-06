import type { ITeamNewsItem } from '@/types/team-news.types';
import { getNewsTagChips } from '@/utils/news-tag-chips';

/** "Narrow by" offers at most this many tags (the spec's three; the prototype shows four). */
export const NARROW_BY_MAX = 3;

const NO_TOPICS: ReadonlySet<string> = new Set();

/**
 * Every tag a card can show for the item, as `NewsTagChips` picks them (without its three-tag limit): with News
 * preferences on, its topics, once the topic list has loaded; with it off, every tag but the legacy verbs.
 */
export function chipVocabulary(
  item: Pick<ITeamNewsItem, 'tags'>,
  topicSlugs: ReadonlySet<string> | null,
  newsPreferencesOn: boolean,
): string[] {
  if (newsPreferencesOn) return topicSlugs ? getNewsTagChips(item.tags, topicSlugs) : [];
  return getNewsTagChips(item.tags, NO_TOPICS, { withExtras: true });
}

/**
 * "Narrow by" on the signed-in Home's scope row (LAB-3125, prototype `WeekFeed` relatedTags): the commonest other
 * tags on the stories still in scope, and only ones that would actually narrow it (carried by some of them, not all).
 * Ties keep the order the tags were first seen in. `tagsOf` gives a story's tags in the cards' chip vocabulary, so
 * every suggestion is a tag a card could show.
 */
export function selectNarrowByTags(
  inScope: readonly ITeamNewsItem[],
  scope: readonly string[],
  tagsOf: (item: ITeamNewsItem) => readonly string[],
  max: number = NARROW_BY_MAX,
): string[] {
  if (scope.length === 0) return [];
  const selected = new Set(scope);
  const freq = new Map<string, number>();
  for (const item of inScope) {
    for (const tag of new Set(tagsOf(item))) {
      if (!selected.has(tag)) freq.set(tag, (freq.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(freq.entries())
    .filter(([, n]) => n < inScope.length)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([tag]) => tag);
}
