'use client';

import type { TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import { NewsCard } from '@/components/page/home/TeamNews/components/NewsCard/NewsCard';
import type { ITeamNewsItem } from '@/types/team-news.types';

interface TeamNewsCardProps {
  item: ITeamNewsItem;
  position?: number;
  variant?: 'flat' | 'outline';
  onClick?: (item: ITeamNewsItem) => void;
  analyticsSource: TeamNewsAnalyticsSource;
  onUpvoteToggle?: (item: ITeamNewsItem) => void;
}

export function TeamNewsCard({
  item,
  position = 0,
  variant = 'outline',
  onClick,
  analyticsSource,
  onUpvoteToggle,
}: TeamNewsCardProps) {
  return (
    <NewsCard
      item={item}
      position={position}
      hideTeam
      compact
      variant={variant}
      onClick={onClick}
      analyticsSource={analyticsSource}
      upvoteCount={item.upvoteCount ?? 0}
      viewerHasUpvoted={Boolean(item.viewerHasUpvoted)}
      onUpvoteToggle={onUpvoteToggle}
    />
  );
}
