import type { ITeamNewsDiscussion } from '@/types/team-news.types';

export function hasExistingDiscussion(d: ITeamNewsDiscussion): d is ITeamNewsDiscussion & { latestTopicUrl: string } {
  return d.count > 0 && !!d.latestTopicUrl;
}
