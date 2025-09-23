import React from 'react';

import { ForumFoundItem, FoundItem } from '@/services/search/types';
import { SearchResultsItem } from './components/SearchResultsItem';

import { groupItemsByIndex } from './utils/groupItemsByIndex';
import { getIndexDisplayName } from './utils/getIndexDisplayName';

import s from './SearchResultsSection.module.scss';

interface Props {
  title?: string;
  items: FoundItem[] | ForumFoundItem[];
  query: string;
  onSelect?: () => void;
  groupItems?: boolean;
}

const SECTION_TYPE_ICONS = {
  teams: '/icons/teams.svg',
  members: '/icons/members.svg',
  projects: '/icons/projects.svg',
  events: '/icons/irl-event-default-logo.svg',
  forumThreads: '/icons/chat.svg',
};

export const SearchResultsSection = ({ title, items, query, onSelect, groupItems = false }: Props) => {
  if (groupItems) {
    const groupedItems = groupItemsByIndex(items);

    return (
      <>
        <div className={s.root}>
          {title && (
            <div className={s.label}>
              {title} ({items.length})
            </div>
          )}
          {Object.entries(groupedItems).map(([index, groupItems]) => (
            <div key={index}>
              <div className={s.groupTitle}>{getIndexDisplayName(index)}</div>
              <ul className={s.list}>
                {groupItems.map((item) => (
                  <SearchResultsItem key={item.uid} item={item} onSelect={onSelect} />
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={s.divider} />
      </>
    );
  }

  return (
    <>
      <div className={s.root}>
        {title && (
          <div className={s.label}>
            {title} ({items.length})
          </div>
        )}
        <ul className={s.list}>
          {items.map((item) => (
            <SearchResultsItem key={item.uid} item={item} onSelect={onSelect} />
          ))}
        </ul>
      </div>
      <div className={s.divider} />
    </>
  );
};
