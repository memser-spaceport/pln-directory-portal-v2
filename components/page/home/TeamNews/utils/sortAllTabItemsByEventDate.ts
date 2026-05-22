import type { ITeamNewsItem } from '@/types/team-news.types';

export const sortAllTabItemsByEventDate = (items: ITeamNewsItem[]): ITeamNewsItem[] =>
  items.slice().sort((a, b) => {
    const byEventDate = b.eventDate.localeCompare(a.eventDate);
    if (byEventDate !== 0) return byEventDate;
    return b.createdAt.localeCompare(a.createdAt);
  });
