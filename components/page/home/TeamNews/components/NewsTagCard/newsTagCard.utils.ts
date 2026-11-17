import { ALL_CAT, ALL_TAB, FOR_YOU_CAT } from '@/components/page/home/TeamNews/constants';
import type { INewsDefaultTags, INewsTag, NewsDefaultTagsSource } from '@/types/team-news.types';

export type TagCardSource = Exclude<NewsDefaultTagsSource, 'member-set'>;
export type TagCard = { tags: INewsTag[]; source: TagCardSource };

/**
 * What the tag card shows, or null when there is no card: the member set their own tags, already answered, or has no
 * default tag. Null too while the default tags are loading and after a failed request (no data).
 */
export function resolveTagCard(defaultTags: INewsDefaultTags | null | undefined): TagCard | null {
  if (!defaultTags || !Array.isArray(defaultTags.tags) || defaultTags.tags.length === 0) return null;
  if (defaultTags.approved || defaultTags.source === 'member-set') return null;
  return { tags: defaultTags.tags, source: defaultTags.source };
}

/** The card takes the "For you" line's place on For You, and on All with no focus-area tab, topic filter or search. */
export function isTagCardVisible(input: {
  preferencesOn: boolean;
  signedIn: boolean;
  hasCard: boolean;
  activeTab: string;
  activeCategory: string;
  query: string;
  hasTopicFilter: boolean;
}): boolean {
  return (
    input.preferencesOn &&
    input.signedIn &&
    input.hasCard &&
    input.activeTab === ALL_TAB &&
    (input.activeCategory === ALL_CAT || input.activeCategory === FOR_YOU_CAT) &&
    input.query.trim() === '' &&
    !input.hasTopicFilter
  );
}

const SOURCE_LINES: Record<TagCardSource, string> = {
  'interest-profile': 'Picked from your activity in the network.',
  ai: 'Picked from your profile, teams and projects.',
  team: "Picked from your teams' focus areas.",
};

export function sourceLine(source: TagCardSource): string {
  return SOURCE_LINES[source];
}
