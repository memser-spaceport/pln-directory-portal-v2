import React, { useRef, useState } from 'react';
import Image from 'next/image';

import s from './ApplicationSearch.module.scss';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import { useApplicationSearch } from '@/services/search/hooks/useApplicationSearch';
import { TryAiSearch } from '@/components/core/application-search/components/TryAiSearch';
import { TryToSearch } from '@/components/core/application-search/components/TryToSearch';
import { RecentSearch } from '@/components/core/application-search/components/RecentSearch';
import { NothingFound } from '@/components/core/application-search/components/NothingFound';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';
import useClickedOutside from '@/hooks/useClickedOutside';
import { useQueryClient } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';

export const ApplicationSearch = () => {
  const inputRef: any = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setFocused] = useState(false);
  const queryClient = useQueryClient();

  useClickedOutside({
    callback: (e) => {
      if ((e.target as HTMLElement).id === 'application-search-clear-icon' || (e.target as HTMLElement).id === 'application-search-clear') {
        return;
      }

      setFocused(false);
      setSearchTerm('');
      queryClient.cancelQueries({ queryKey: [SearchQueryKeys.GET_APPLICATION_SEARCH_RESULTS] });
      queryClient.removeQueries({ queryKey: [SearchQueryKeys.GET_APPLICATION_SEARCH_RESULTS] });
    },
    ref: inputRef,
  });

  const { data, isLoading, refetch } = useApplicationSearch(searchTerm);

  const isOpen = isFocused || !!data;

  const handleTryAiSearch = () => {
    // todo - show full search modal using search term
  };

  function renderContent() {
    if (!searchTerm) {
      return (
        <>
          <TryAiSearch />
          <TryToSearch />
          <div className={s.divider} />
          <RecentSearch onSelect={(text) => setSearchTerm(text)} />
        </>
      );
    }

    if (isLoading) {
      return <div>Loading...</div>;
    }

    // todo -handle no data
    if (!data) {
      return <NothingFound onClick={handleTryAiSearch} />;
    }

    return (
      <>
        {!!data.teams?.length && <SearchResultsSection type="teams" title="Teams" items={data.teams} query={searchTerm} />}
        {!!data.members?.length && <SearchResultsSection type="members" title="Members" items={data.members} query={searchTerm} />}
        {!!data.projects?.length && <SearchResultsSection type="projects" title="Projects" items={data.projects} query={searchTerm} />}
        {!!data.events && <SearchResultsSection type="events" title="Events" items={data.events} query={searchTerm} />}
      </>
    );
  }

  return (
    <div className={s.root} ref={inputRef} id="application-search">
      <DebouncedInput
        onChange={(val) => {
          setFocused(true);
          setSearchTerm(val);
        }}
        placeholder="Search"
        value={searchTerm}
        flushIcon={<Image src="/icons/search-right.svg" alt="Search" width={20} height={20} />}
        onImplictFlush={refetch}
        onClick={() => setFocused(true)}
      />

      {isOpen && <div className={s.dropdown}>{renderContent()}</div>}
    </div>
  );
};
