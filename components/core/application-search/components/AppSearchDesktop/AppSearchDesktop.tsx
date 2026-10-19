import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState, useEffect, useCallback } from 'react';

import type { FoundItem } from '@/services/search/types';

import { SearchQueryKeys } from '@/services/search/constants';
import { REOPEN_HEADER_SEARCH_EVENT } from '@/components/constants/aiSearchHandoff';

import { openAiSearch } from '@/components/utils/openAiSearch';
import { askAboutItem } from '@/components/core/application-search/utils/askAboutItem';

import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useRecordRecentSearch } from '@/services/search/hooks/useRecordRecentSearch';
import { useFullApplicationSearch } from '@/services/search/hooks/useFullApplicationSearch';

import { RecentSearch } from '@/components/core/application-search/components/RecentSearch';
import { ContentLoader } from '@/components/core/application-search/components/ContentLoader';
import { RecentAiChats } from '@/components/core/application-search/components/RecentAiChats';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import { SearchCategories } from '@/components/core/application-search/components/SearchCategories';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';

import s from './AppSearchDesktop.module.scss';

interface Props {
  isLoggedIn: boolean;
}

export const AppSearchDesktop = ({ isLoggedIn }: Props) => {
  const inputRef: any = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setFocused] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<
    'top' | 'members' | 'teams' | 'projects' | 'forumThreads' | 'events' | null
  >('top');

  const closeDropdown = useCallback(() => {
    setSearchTerm('');
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

      if (
        (e.target as HTMLElement).classList.contains('search-suggestion') ||
        (e.target as HTMLElement).classList.contains('chat-recent-search')
      ) {
        return;
      }

      setFocused(false);
      setSearchTerm('');
      queryClient.cancelQueries({ queryKey: [SearchQueryKeys.GET_APPLICATION_SEARCH_RESULTS] });
      queryClient.removeQueries({ queryKey: [SearchQueryKeys.GET_APPLICATION_SEARCH_RESULTS] });
    },
    [queryClient],
  );

  useOnClickOutside([inputRef], handleInputClickOutside);

  const { data, isLoading } = useFullApplicationSearch(searchTerm);

  /* Recent used to be written by that hook's fetcher; it is the caller's job
     now. See useRecordRecentSearch. */
  useRecordRecentSearch(searchTerm);

  const isOpen = isFocused; //  || !!data;

  const handleChange = useCallback((val: string) => {
    setFocused(true);
    setSearchTerm(val);
  }, []);

  const handleClick = useCallback(() => {
    setFocused(true);
  }, []);

  const openAi = useCallback(
    (options: { question?: string; threadId?: string; showHistory?: boolean }) => {
      setFocused(false);
      openAiSearch({ router, term: searchTerm, ...options });
    },
    [router, searchTerm],
  );

  // "Back to search" on the AI Search page brings the popover back with the term the member left with.
  useEffect(() => {
    const reopen = (e: Event) => {
      setSearchTerm((e as CustomEvent<{ term: string }>).detail.term);
      setFocused(true);
      inputRef.current?.querySelector('input')?.focus();
    };
    document.addEventListener(REOPEN_HEADER_SEARCH_EVENT, reopen);
    return () => document.removeEventListener(REOPEN_HEADER_SEARCH_EVENT, reopen);
  }, []);

  const askAi = (item: FoundItem) => openAi({ question: askAboutItem(item) });

  function renderContent() {
    if (!searchTerm) {
      return (
        <div className={s.idle}>
          {isLoggedIn && <RecentSearch onSelect={handleChange} />}
          {isLoggedIn && (
            <RecentAiChats
              onOpenChat={(threadId) => openAi({ threadId })}
              onShowAll={() => openAi({ showHistory: true })}
            />
          )}
          <p className={s.hint}>Search members, teams, projects, events and forum posts.</p>
        </div>
      );
    }

    if (isLoading) {
      return <ContentLoader />;
    }

    if (
      !data ||
      (!data.events?.length &&
        !data.teams?.length &&
        !data.members?.length &&
        !data.projects?.length &&
        !data.forumThreads?.length)
    ) {
      return (
        <div className={clsx(s.content, s.noResultsContent)}>
          <SearchCategories data={data} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          <p className={s.noResults}>
            No results for &ldquo;{searchTerm}&rdquo;
            <button type="button" className={s.askAi} onClick={() => openAi({ question: searchTerm })}>
              Ask AI Search instead
            </button>
          </p>
        </div>
      );
    }

    return (
      <div className={s.content}>
        <SearchCategories data={data} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        {!!data.top?.length && (activeCategory === 'top' || activeCategory === null) && (
          <SearchResultsSection
            groupItems
            items={data.top}
            query={searchTerm}
            onSelect={closeDropdown}
            onAskAi={askAi}
          />
        )}
        {!!data.members?.length && (activeCategory === 'members' || activeCategory === null) && (
          <SearchResultsSection items={data.members} query={searchTerm} onSelect={closeDropdown} onAskAi={askAi} />
        )}
        {!!data.teams?.length && (activeCategory === 'teams' || activeCategory === null) && (
          <SearchResultsSection items={data.teams} query={searchTerm} onSelect={closeDropdown} onAskAi={askAi} />
        )}
        {!!data.projects?.length && (activeCategory === 'projects' || activeCategory === null) && (
          <SearchResultsSection items={data.projects} query={searchTerm} onSelect={closeDropdown} onAskAi={askAi} />
        )}
        {!!data.forumThreads?.length && (activeCategory === 'forumThreads' || activeCategory === null) && (
          <SearchResultsSection items={data.forumThreads} query={searchTerm} onSelect={closeDropdown} onAskAi={askAi} />
        )}
        {!!data.events?.length && (activeCategory === 'events' || activeCategory === null) && (
          <SearchResultsSection items={data.events} query={searchTerm} onSelect={closeDropdown} onAskAi={askAi} />
        )}
      </div>
    );
  }

  return (
    <div className={clsx(s.root, isOpen && s.rootOpen)} ref={inputRef} id="application-search">
      <SearchGlyph />
      <DebouncedInput
        onChange={handleChange}
        placeholder="Search"
        value={searchTerm}
        onClick={handleClick}
        clearIcon={<span className={s.clearLabel}>Clear</span>}
        classes={{ root: s.inputRoot, input: s.input, clearBtn: s.clear }}
      />
      <button
        type="button"
        className={s.aiBadge}
        onClick={() => openAi({ question: searchTerm.trim() || undefined })}
        aria-label="Open AI Search"
      >
        <span className={s.aiBadgeIcon} aria-hidden="true" />
        AI
      </button>
      {isOpen && <div className={clsx('app-search-dropdown', s.dropdown)}>{renderContent()}</div>}
    </div>
  );
};

const SearchGlyph = () => (
  <svg className={s.searchGlyph} width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="8.75" cy="8.75" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M13.25 13.25L17.5 17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
