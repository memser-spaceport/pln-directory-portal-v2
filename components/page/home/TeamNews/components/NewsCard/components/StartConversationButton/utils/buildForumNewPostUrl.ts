import type { ITeamNewsItem } from '@/types/team-news.types';

const FORUM_TOPIC = 'General';

export function buildForumNewPostUrl(item: ITeamNewsItem): string {
  const params = new URLSearchParams({
    title: item.title,
    url: item.sourceUrl,
    topic: FORUM_TOPIC,
    newsItemUid: item.uid,
  });

  return `/forum/posts/new?${params.toString()}`;
}
