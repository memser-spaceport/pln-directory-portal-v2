import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import { TryAiSearch } from '@/components/core/application-search/components/TryAiSearch';
import { TryToSearch } from '@/components/core/application-search/components/TryToSearch';
import { clsx } from 'clsx';
import { RecentSearch } from '@/components/core/application-search/components/RecentSearch';
import { ContentLoader } from '@/components/core/application-search/components/ContentLoader';
import { NothingFound } from '@/components/core/application-search/components/NothingFound';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';
import { FullSearchResults } from '@/components/core/application-search/components/FullSearchResults';
import { useApplicationSearch } from '@/services/search/hooks/useApplicationSearch';

import s from './FullSearchPanel.module.scss';

interface Props {
  initialSearchTerm: string;
}

export const FullSearchPanel = ({ initialSearchTerm }: Props) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isFocused, setFocused] = useState(!initialSearchTerm);
  const { data, isLoading } = useApplicationSearch(searchTerm);

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
            <TryToSearch onSelect={handleChange} />
            <div className={clsx(s.divider, s.mt1)} />
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
    } else {
      return <FullSearchResults searchTerm={searchTerm} />;
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
