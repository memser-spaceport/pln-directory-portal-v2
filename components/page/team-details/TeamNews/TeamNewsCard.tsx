'use client';

import clsx from 'clsx';

import { NewsCard } from '@/components/page/home/TeamNews/components/NewsCard/NewsCard';
import type { ITeamNewsItem } from '@/types/team-news.types';

import s from './TeamNewsRail.module.scss';

interface TeamNewsCardProps {
  item: ITeamNewsItem;
  position?: number;
  variant?: 'flat' | 'outline';
  onClick?: (item: ITeamNewsItem) => void;
}

export function TeamNewsCard({ item, position = 0, variant = 'outline', onClick }: TeamNewsCardProps) {
  return (
    <NewsCard
      item={item}
      position={position}
      hideTeamLink
      onClick={onClick}
      className={clsx(variant === 'flat' ? s.flatNews : s.cardOutline)}
    />
  );
}
