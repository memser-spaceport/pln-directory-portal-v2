import React, { useCallback, useRef, useState } from 'react';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import Image from 'next/image';

import s from './AppSearchDesktop.module.scss';
import { useQueryClient } from '@tanstack/react-query';
import useClickedOutside from '@/hooks/useClickedOutside';
import { SearchQueryKeys } from '@/services/search/constants';
import { useApplicationSearch } from '@/services/search/hooks/useApplicationSearch';
import { TryAiSearch } from '@/components/core/application-search/components/TryAiSearch';
import { TryToSearch } from '@/components/core/application-search/components/TryToSearch';
import { RecentSearch } from '@/components/core/application-search/components/RecentSearch';
import { ContentLoader } from '@/components/core/application-search/components/ContentLoader';
import { NothingFound } from '@/components/core/application-search/components/NothingFound';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';
import { FullSearchPanel } from '@/components/core/application-search/components/FullSearchPanel';
import { AiChatPanel } from '@/components/core/application-search/components/AiChatPanel';
import clsx from 'clsx';

export const AppSearchDesktop = () => {
  const inputRef: any = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setFocused] = useState(false);
  const queryClient = useQueryClient();
  const [showFullSearch, setShowFullSearch] = useState(false);

  useClickedOutside({
    callback: (e) => {
      if ((e.target as HTMLElement).id === 'application-search-clear-icon' || (e.target as HTMLElement).id === 'application-search-clear') {
        return;
      }

      if ((e.target as HTMLElement).classList.contains('search-suggestion') || (e.target as HTMLElement).classList.contains('chat-recent-search')) {
        return;
      }

      setFocused(false);
      setSearchTerm('');
      queryClient.cancelQueries({ queryKey: [SearchQueryKeys.GET_APPLICATION_SEARCH_RESULTS] });
      queryClient.removeQueries({ queryKey: [SearchQueryKeys.GET_APPLICATION_SEARCH_RESULTS] });
    },
    ref: inputRef,
  });

  const { data, isLoading } = useApplicationSearch(searchTerm);

  const isOpen = isFocused; //  || !!data;

  const handleChange = useCallback((val: string) => {
    setFocused(true);
    setSearchTerm(val);
  }, []);

  const handleFlush = useCallback(() => {
    setFocused(false);
    setShowFullSearch(true);
  }, []);

  const handleClick = useCallback(() => {
    setFocused(true);
  }, []);

  const handleTryAiSearch = () => {
    // todo - show full search modal using search term
  };

  function renderContent() {
    if (!searchTerm) {
      return (
        <>
          <TryAiSearch />
          <TryToSearch onSelect={handleChange} />
          <div className={s.divider} />
          <RecentSearch onSelect={handleChange} />
        </>
      );
    }

    if (isLoading) {
      return <ContentLoader />;
    }

    if (!data || (!data.events?.length && !data.teams?.length && !data.members?.length && !data.projects?.length)) {
      return <NothingFound onClick={handleTryAiSearch} />;
    }

    return (
      <>
        <TryAiSearch />
        {!!data.teams?.length && <SearchResultsSection title="Teams" items={data.teams} query={searchTerm} />}
        {!!data.members?.length && <SearchResultsSection title="Members" items={data.members} query={searchTerm} />}
        {!!data.projects?.length && <SearchResultsSection title="Projects" items={data.projects} query={searchTerm} />}
        {!!data.events?.length && <SearchResultsSection title="Events" items={data.events} query={searchTerm} />}
      </>
    );
  }

  return (
    <>
      {showFullSearch ? (
        <div className={s.modal}>
          <div className={s.modalContent}>
            <button type="button" className={s.closeButton} onClick={() => setShowFullSearch(!showFullSearch)}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            <div className={s.wrapper}>
              <FullSearchPanel initialSearchTerm={searchTerm} />
              <AiChatPanel />
            </div>
          </div>
        </div>
      ) : (
        <div className={s.root} ref={inputRef} id="application-search">
          <DebouncedInput
            onChange={handleChange}
            placeholder="Search"
            value={searchTerm}
            flushIcon={<Image src="/icons/search-right.svg" alt="Search" width={20} height={20} />}
            onImplictFlush={handleFlush}
            onClick={handleClick}
          />
          {isOpen && <div className={clsx('app-search-dropdown', s.dropdown)}>{renderContent()}</div>}
        </div>
      )}
    </>
  );
};
