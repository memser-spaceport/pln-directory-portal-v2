import React from 'react';
import Image from 'next/image';

import s from './TryAiSearch.module.scss';

export const TryAiSearch = ({ onClick }: { onClick: () => void }) => {
  return (
    <button className={s.root} onClick={onClick}>
      <Image src="/icons/ai-search.svg" alt="Search" width={24} height={24} />
      Try AI Search for more results
    </button>
  );
};
