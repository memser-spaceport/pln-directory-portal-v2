import React from 'react';

import s from './RecentSearch.module.scss';
import { useRecentSearch } from '@/services/search/hooks/useRecentSearch';
import Image from 'next/image';
import { useRemoveRecentSearch } from '@/services/search/hooks/useRemoveRecentSearch';

interface Props {
  onSelect: (text: string) => void;
}

export const RecentSearch = ({ onSelect }: Props) => {
  const { data } = useRecentSearch();
  const { mutate, isPending } = useRemoveRecentSearch();

  return (
    <div className={s.root}>
      <div className={s.label}>Recent</div>
      <ul className={s.list}>
        {data?.map((item) => (
          <li key={item.id} className={s.searchItem} onClick={() => onSelect(item.text)}>
            <span className={s.searchItemText}>{item.text}</span>
            <button
              className={s.removeButton}
              onClick={(e) => {
                e.stopPropagation();
                mutate({ id: item.id });
              }}
            >
              <Image src="/icons/close-gray.svg" alt="Search" width={20} height={20} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
