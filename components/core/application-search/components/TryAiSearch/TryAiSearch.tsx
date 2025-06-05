import React from 'react';
import Image from 'next/image';

import s from './TryAiSearch.module.scss';

export const TryAiSearch = ({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => {
  return (
    <button className={s.btn} onClick={() => onClick()} disabled={disabled} id="application-search-try-ai">
      <Image src="/icons/ai-search.svg" alt="Search" width={24} height={24} />
      Try AI Search for more results
    </button>
  );
};
