import React, { useCallback, useRef, useState } from 'react';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import Image from 'next/image';

import s from './AppSearchDesktop.module.scss';
import { useQueryClient } from '@tanstack/react-query';
import { SearchQueryKeys } from '@/services/search/constants';
import { TryAiSearch } from '@/components/core/application-search/components/TryAiSearch';
import { RecentSearch } from '@/components/core/application-search/components/RecentSearch';
import { ContentLoader } from '@/components/core/application-search/components/ContentLoader';
import { NothingFound } from '@/components/core/application-search/components/NothingFound';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';
import { FullSearchPanel } from '@/components/core/application-search/components/FullSearchPanel';
import { AiChatPanel } from '@/components/core/application-search/components/AiChatPanel';
import clsx from 'clsx';
import { IUserInfo } from '@/types/shared.types';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { AiConversationHistory } from '@/components/core/application-search/components/AiConversationHistory/AiConversationHistory';
import { useRouter } from 'next/navigation';
import { useFullApplicationSearch } from '@/services/search/hooks/useFullApplicationSearch';

interface Props {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  authToken: string;
}

export const AppSearchDesktop = ({ isLoggedIn, userInfo, authToken }: Props) => {
  const inputRef: any = useRef(null);
  const fullSearchDialogRef: any = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setFocused] = useState(false);
  const queryClient = useQueryClient();
  const [showFullSearch, setShowFullSearch] = useState(false);
  const [initialAiPrompt, setInitialAiPrompt] = useState('');
  const router = useRouter();

  const handleFullSearchClose = useCallback(() => {
    setInitialAiPrompt('');
    setSearchTerm('');
    setShowFullSearch(false);
    setFocused(false);
  }, []);

  const handleInputClickOutside = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (
        (e.target as HTMLElement).id === 'application-search-clear-icon' ||
        (e.target as HTMLElement).id === 'application-search-clear' ||
        (e.target as HTMLElement).id === 'application-search-try-ai' ||
        (e.target as HTMLElement).id === 'application-search-nothing-found'
      ) {
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
    [queryClient],
  );

  const handleFullSearchClickOutside = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (
        (e.target as HTMLElement).id === 'application-search-clear-icon' ||
        (e.target as HTMLElement).id === 'application-search-clear' ||
        (e.target as HTMLElement).id === 'application-search-try-ai' ||
        (e.target as HTMLElement).id === 'application-search-nothing-found'
      ) {
        return;
      }

      if ((e.target as HTMLElement).classList.contains('search-suggestion') || (e.target as HTMLElement).classList.contains('chat-recent-search')) {
        return;
      }

      if ((e.target as HTMLElement).id === 'application-search-flush') {
        return;
      }

      handleFullSearchClose();
      queryClient.cancelQueries({ queryKey: [SearchQueryKeys.GET_APPLICATION_SEARCH_RESULTS] });
      queryClient.removeQueries({ queryKey: [SearchQueryKeys.GET_APPLICATION_SEARCH_RESULTS] });
      queryClient.cancelQueries({ queryKey: [SearchQueryKeys.GET_FULL_APPLICATION_SEARCH_RESULTS] });
      queryClient.removeQueries({ queryKey: [SearchQueryKeys.GET_FULL_APPLICATION_SEARCH_RESULTS] });
    },
    [handleFullSearchClose, queryClient],
  );

  useOnClickOutside([inputRef], handleInputClickOutside);
  useOnClickOutside([fullSearchDialogRef], handleFullSearchClickOutside);

  const { data, isLoading } = useFullApplicationSearch(searchTerm);

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

  const handleTryAiSearch = useCallback(
    (val?: string) => {
      setFocused(false);
      setShowFullSearch(true);
      setInitialAiPrompt(val ?? searchTerm);
    },
    [searchTerm],
  );

  function renderContent() {
    if (!searchTerm) {
      return (
        <>
          {isLoggedIn && <AiConversationHistory onClick={handleTryAiSearch} isLoggedIn={isLoggedIn} />}
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
        <TryAiSearch onClick={handleTryAiSearch} disabled={searchTerm.trim().length === 0} />
        {!!data.teams?.length && <SearchResultsSection title="Teams" items={data.teams} query={searchTerm} onSelect={handleFullSearchClose} />}
        {!!data.members?.length && <SearchResultsSection title="Members" items={data.members} query={searchTerm} onSelect={handleFullSearchClose} />}
        {!!data.projects?.length && <SearchResultsSection title="Projects" items={data.projects} query={searchTerm} onSelect={handleFullSearchClose} />}
        {!!data.events?.length && <SearchResultsSection title="Events" items={data.events} query={searchTerm} onSelect={handleFullSearchClose} />}
      </>
    );
  }

  return (
    <>
      {showFullSearch ? (
        <div className={s.modal}>
          <div className={s.modalContent} ref={fullSearchDialogRef}>
            <button type="button" className={s.closeButton} onClick={handleFullSearchClose}>
              <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
            </button>
            <div className={s.wrapper}>
              <FullSearchPanel initialSearchTerm={searchTerm} onTryAiSearch={handleTryAiSearch} onClose={handleFullSearchClose} />
              <AiChatPanel initialPrompt={initialAiPrompt} isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
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
