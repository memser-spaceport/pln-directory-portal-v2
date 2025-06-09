import React from 'react';
import Image from 'next/image';

import s from './NothingFound.module.scss';

interface Props {
  onClick: () => void;
}

export const NothingFound = ({ onClick }: Props) => {
  return (
    <div style={{ padding: '8px 16px' }}>
      <button className={s.root} onClick={() => onClick()} id="application-search-nothing-found">
        <div className={s.content}>
          <div className={s.title}>Nothing found</div>
          <div className={s.subtitle}>Try AI Search for more results</div>
        </div>
        <Image src="/icons/ai-search.svg" alt="Search" width={24} height={24} />
      </button>
    </div>
  );
};
