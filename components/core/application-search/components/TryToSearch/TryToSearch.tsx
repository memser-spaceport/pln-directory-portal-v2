import React from 'react';

import s from './TryToSearch.module.scss';
import { AI_SEARCH_SUGGESTIONS } from '@/services/search/constants';
import clsx from 'clsx';

interface Props {
  onSelect: (text: string) => void;
}

export const TryToSearch = ({ onSelect }: Props) => {
  return (
    <div className={s.root}>
      <div className={s.label}>Try to Search</div>
      <ul className={s.list}>
        {AI_SEARCH_SUGGESTIONS.map((item, i) => (
          <li key={i}>
            <button className={clsx('search-suggestion', s.suggestionButton)} onClick={() => onSelect(item)}>
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
