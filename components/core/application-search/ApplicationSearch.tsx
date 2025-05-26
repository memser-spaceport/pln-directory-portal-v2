import React, { useEffect, useState } from 'react';
import Image from 'next/image';

import s from './ApplicationSearch.module.scss';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import { useApplicationSearch } from '@/services/search/hooks/useApplicationSearch';
import { TryAiSearch } from '@/components/core/application-search/components/TryAiSearch';
import { TryToSearch } from '@/components/core/application-search/components/TryToSearch';

export const ApplicationSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setFocused] = useState(false);

  const { data, isLoading, refetch } = useApplicationSearch(searchTerm);

  const isOpen = isFocused || !!data || true;

  return (
    <div className={s.root}>
      <DebouncedInput
        onChange={setSearchTerm}
        placeholder="Search"
        value={searchTerm}
        flushIcon={<Image src="/icons/search-right.svg" alt="Search" width={20} height={20} />}
        onImplictFlush={refetch}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {isOpen && (
        <div className={s.dropdown}>
          <TryAiSearch />
          <TryToSearch />
        </div>
      )}
    </div>
  );
};
