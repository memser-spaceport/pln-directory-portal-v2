import React from 'react';

import s from './RecentSearch.module.scss';
import Image from 'next/image';
import { clsx } from 'clsx';
import { useRecentSearch } from '@/services/search/hooks/useRecentSearch';
import { useRemoveRecentSearch } from '@/services/search/hooks/useRemoveRecentSearch';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';

interface Props {
  onSelect: (text: string) => void;
}

export const RecentSearch = ({ onSelect }: Props) => {
  const { data } = useRecentSearch();
  const { mutate } = useRemoveRecentSearch();
  const analytics = useUnifiedSearchAnalytics();

  if (!data?.length) {
    return null;
  }

  return (
    <>
      <div className={s.divider} />
      <div className={s.root}>
        <div className={s.label}>Recent</div>
        <ul className={s.list}>
          {data?.map((item) => (
            <li
              key={item}
              className={clsx('chat-recent-search', s.searchItem)}
              onClick={() => {
                analytics.onRecentSearchClick(item);
                onSelect(item);
              }}
            >
              <span className={s.searchItemText}>{item}</span>
              <button
                className={clsx(s.removeButton)}
                onClick={(e) => {
                  e.stopPropagation();
                  analytics.onRecentSearchDeleteClick(item);
                  mutate({ item });
                }}
              >
                <Image src="/icons/close-gray.svg" alt="Search" width={20} height={20} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
