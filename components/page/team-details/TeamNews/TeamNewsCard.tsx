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
}

export function TeamNewsCard({ item, position = 0, variant = 'outline', onClick, analyticsSource }: TeamNewsCardProps) {
  return (
    <NewsCard
      item={item}
      position={position}
      hideTeam
      variant={variant}
      onClick={onClick}
      analyticsSource={analyticsSource}
    />
  );
}
