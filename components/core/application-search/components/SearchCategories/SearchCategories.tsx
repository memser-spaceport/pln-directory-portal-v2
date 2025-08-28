import React from 'react';

import s from './SearchCategories.module.scss';
import { SearchResult } from '@/services/search/types';
import { clsx } from 'clsx';

interface Props {
  data: SearchResult | undefined;
  activeCategory: keyof SearchResult | null;
  setActiveCategory: (category: keyof SearchResult | null) => void;
}

export const SearchCategories = ({ data, activeCategory, setActiveCategory }: Props) => {
  if (!data) return null;

  function renderCategoryBadge(category: keyof SearchResult, label: string) {
    if (!data?.[category]?.length) {
      return null;
    }

    return (
      <div
        className={clsx(s.categoryBadge, {
          [s.active]: activeCategory === category,
        })}
        onClick={() => setActiveCategory(category === activeCategory ? null : category)}
      >
        {label} {data?.[category]?.length}
      </div>
    );
  }

  return (
    <div className={s.root}>
      {renderCategoryBadge('top', 'Top')}
      {renderCategoryBadge('members', 'Members')}
      {renderCategoryBadge('teams', 'Teams')}
      {renderCategoryBadge('projects', 'Projects')}
      {renderCategoryBadge('forum', 'Forum')}
      {renderCategoryBadge('events', 'Events')}
    </div>
  );
};
