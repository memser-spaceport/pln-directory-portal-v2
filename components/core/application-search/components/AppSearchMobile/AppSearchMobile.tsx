import React, { useCallback, useState } from 'react';
import Image from 'next/image';

import s from './AppSearchMobile.module.scss';
import { SearchModeToggle } from '@/components/core/application-search/components/SearchModeToggle';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import { useApplicationSearch } from '@/services/search/hooks/useApplicationSearch';
import { TryAiSearch } from '@/components/core/application-search/components/TryAiSearch';
import { TryToSearch } from '@/components/core/application-search/components/TryToSearch';
import { RecentSearch } from '@/components/core/application-search/components/RecentSearch';
import { ContentLoader } from '@/components/core/application-search/components/ContentLoader';
import { NothingFound } from '@/components/core/application-search/components/NothingFound';
import { clsx } from 'clsx';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';
import { FullSearchResults } from '@/components/core/application-search/components/FullSearchResults';

export const AppSearchMobile = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'regular' | 'ai'>('regular');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setFocused] = useState(true);
  const { data, isLoading, refetch } = useApplicationSearch(searchTerm);

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
    // todo - show full search modal using search term
  };

  function renderContent() {
    if (isFocused) {
      if (!searchTerm) {
        return (
          <>
            <TryAiSearch />
            <TryToSearch />
            <div className={clsx(s.divider, s.mt1)} />
            <RecentSearch onSelect={(text) => setSearchTerm(text)} />
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
    } else {
      return <FullSearchResults searchTerm={searchTerm} />;
    }
  }

  return (
    <div className={s.root}>
      <button className={s.toggleButton} onClick={() => setOpen(true)}>
        <Image src="/icons/search-right.svg" alt="Search" width={20} height={20} />
      </button>
      {open && (
        <div className={s.wrapper}>
          <div className={s.top}>
            <div className={s.header}>
              <SearchModeToggle active={mode} onChange={setMode} />
              <span className={s.title}>Search</span>
              <button
                className={s.closeButton}
                onClick={() => {
                  setOpen(false);
                  setFocused(true);
                  setSearchTerm('');
                }}
              >
                <Image src="/icons/close-gray.svg" alt="Close" width={20} height={20} style={{ pointerEvents: 'none' }} />
              </button>
            </div>
            <div className={s.divider} />
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
      )}
    </div>
  );
};
