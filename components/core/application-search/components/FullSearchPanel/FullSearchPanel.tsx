import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import { RecentSearch } from '@/components/core/application-search/components/RecentSearch';
import { ContentLoader } from '@/components/core/application-search/components/ContentLoader';
import { NothingFound } from '@/components/core/application-search/components/NothingFound';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';
import { FullSearchResults } from '@/components/core/application-search/components/FullSearchResults';

import s from './FullSearchPanel.module.scss';
import { useUnifiedSearchAnalytics } from '@/analytics/unified-search.analytics';
import { useFullApplicationSearch } from '@/services/search/hooks/useFullApplicationSearch';
import { SearchResult } from '@/services/search/types';
import { SearchCategories } from '@/components/core/application-search/components/SearchCategories';

interface Props {
  initialSearchTerm: string;
  onTryAiSearch: (query: string) => void;
  onClose: () => void;
  activeCategory: keyof SearchResult | null;
  setActiveCategory: (category: keyof SearchResult | null) => void;
}

export const FullSearchPanel = ({ initialSearchTerm, onTryAiSearch, onClose, activeCategory, setActiveCategory }: Props) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [, setFocused] = useState(!initialSearchTerm);
  const { data, isLoading } = useFullApplicationSearch(searchTerm);
  const analyticsRef = useRef<boolean>(false);
  const isFocused = false;

  const analytics = useUnifiedSearchAnalytics();

  const handleChange = useCallback((val: string) => {
    setFocused(true);
    setSearchTerm(val);
  }, []);

  const handleFlush = useCallback(() => {
    setFocused(false);
  }, []);

  const handleClick = useCallback(() => {
    setFocused(true);
  }, []);

  const handleTryAiSearch = () => {
    onTryAiSearch(searchTerm);
  };

  useEffect(() => {
    if (!analyticsRef.current) {
      analyticsRef.current = true;
      analytics.onFullSearchOpen();
    }
    // eslint-disable-next-line
  }, []);

  function renderContent() {
    if (isFocused) {
      if (!searchTerm) {
        return (
          <>
            {/*<TryAiSearch onClick={handleTryAiSearch} disabled={searchTerm.trim().length === 0} />*/}
            {/*<TryToSearch onSelect={handleChange} />*/}
            {/*<div className={clsx(s.divider, s.mt1)} />*/}
            <RecentSearch onSelect={handleChange} />
          </>
        );
      }

      if (isLoading) {
        return <ContentLoader />;
      }

      if (!data || (!data.events?.length && !data.teams?.length && !data.members?.length && !data.projects?.length && !data.forumThreads?.length)) {
        return <NothingFound onClick={handleTryAiSearch} searchTerm={searchTerm} />;
      }

      return (
        <>
          {/*<TryAiSearch onClick={handleTryAiSearch} disabled={searchTerm.trim().length === 0} />*/}
          <SearchCategories data={data} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          {!!data.top?.length && (activeCategory === 'top' || activeCategory === null) && <SearchResultsSection title="Top" items={data.top} query={searchTerm} onSelect={onClose} />}
          {!!data.members?.length && (activeCategory === 'members' || activeCategory === null) && <SearchResultsSection title="Members" items={data.members} query={searchTerm} onSelect={onClose} />}
          {!!data.teams?.length && (activeCategory === 'teams' || activeCategory === null) && <SearchResultsSection title="Teams" items={data.teams} query={searchTerm} onSelect={onClose} />}
          {!!data.projects?.length && (activeCategory === 'projects' || activeCategory === null) && (
            <SearchResultsSection title="Projects" items={data.projects} query={searchTerm} onSelect={onClose} />
          )}
          {!!data.forumThreads?.length && (activeCategory === 'forumThreads' || activeCategory === null) && (
            <SearchResultsSection title="Forum" items={data.forumThreads} query={searchTerm} onSelect={onClose} />
          )}
          {!!data.events?.length && (activeCategory === 'events' || activeCategory === null) && <SearchResultsSection title="Events" items={data.events} query={searchTerm} onSelect={onClose} />}
          {/*{!!data.teams?.length && <SearchResultsSection title="Teams" items={data.teams} query={searchTerm} onSelect={onClose} />}*/}
          {/*{!!data.members?.length && <SearchResultsSection title="Members" items={data.members} query={searchTerm} onSelect={onClose} />}*/}
          {/*{!!data.projects?.length && <SearchResultsSection title="Projects" items={data.projects} query={searchTerm} onSelect={onClose} />}*/}
          {/*{!!data.events?.length && <SearchResultsSection title="Events" items={data.events} query={searchTerm} onSelect={onClose} />}*/}
        </>
      );
    } else {
      return <FullSearchResults searchTerm={searchTerm} onTryAiSearch={handleTryAiSearch} onClose={onClose} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />;
    }
  }

  return (
    <div className={s.root}>
      <div className={s.top}>
        <div className={s.inputSection}>
          <DebouncedInput
            onChange={handleChange}
            placeholder="Search"
            value={searchTerm}
            flushIcon={<Image src="/icons/search-right.svg" alt="Search" width={20} height={20} />}
            onImplictFlush={handleFlush}
            onClick={handleClick}
          />
        </div>
        <div className={s.divider} />
      </div>
      <div className={s.content}>{renderContent()}</div>
    </div>
  );
};
