import React from 'react';

import s from './TryToSearch.module.scss';
import { AI_SEARCH_SUGGESTIONS } from '@/services/search/constants';

export const TryToSearch = () => {
  return (
    <div className={s.root}>
      <div className={s.label}>Try to Search</div>
      <ul className={s.list}>
        {AI_SEARCH_SUGGESTIONS.map((item, i) => (
          <li key={i}>
            <button className={s.suggestionButton}>{item}</button>
          </li>
        ))}
      </ul>
    </div>
  );
};
