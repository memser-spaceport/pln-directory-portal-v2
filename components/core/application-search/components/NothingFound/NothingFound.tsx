import React from 'react';
import Image from 'next/image';

import s from './NothingFound.module.scss';

interface Props {
  onClick: () => void;
  searchTerm: string;
}

export const NothingFound = ({ onClick, searchTerm }: Props) => {
  return (
    <div style={{ padding: '8px 16px' }}>
      <button className={s.root} onClick={() => onClick()} id="application-search-nothing-found">
        <div className={s.content}>
          <div className={s.title}>No results found for &#34;{searchTerm}&#34;</div>
          <div className={s.subtitle}>Try AI Search for more results</div>
        </div>
        <Image src="/icons/ai-search.svg" alt="Search" width={24} height={24} />
      </button>
    </div>
  );
};
