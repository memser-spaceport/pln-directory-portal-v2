import React, { useCallback, useState } from 'react';
import Image from 'next/image';

import s from './AppSearchMobile.module.scss';
import { SearchModeToggle } from '@/components/core/application-search/components/SearchModeToggle';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import { TryAiSearch } from '@/components/core/application-search/components/TryAiSearch';
import { RecentSearch } from '@/components/core/application-search/components/RecentSearch';
import { ContentLoader } from '@/components/core/application-search/components/ContentLoader';
import { NothingFound } from '@/components/core/application-search/components/NothingFound';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';
import { FullSearchResults } from '@/components/core/application-search/components/FullSearchResults';
import { AiChatPanel } from '@/components/core/application-search/components/AiChatPanel';
import { IUserInfo } from '@/types/shared.types';
import { AiConversationHistory } from '@/components/core/application-search/components/AiConversationHistory/AiConversationHistory';
import { useFullApplicationSearch } from '@/services/search/hooks/useFullApplicationSearch';

interface Props {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  authToken: string;
}

export const AppSearchMobile = ({ isLoggedIn, userInfo, authToken }: Props) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'regular' | 'ai'>('regular');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setFocused] = useState(true);
  const { data, isLoading } = useFullApplicationSearch(searchTerm);
  const [initialAiPrompt, setInitialAiPrompt] = useState('');

  const handleClose = useCallback(() => {
    setOpen(false);
    setFocused(true);
    setSearchTerm('');
    setInitialAiPrompt('');
  }, []);

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

  const handleTryAiSearch = useCallback(
    (val?: string) => {
      setFocused(false);
      setMode('ai');
      setInitialAiPrompt(val ?? searchTerm);
    },
    [searchTerm],
  );

  function renderContent() {
    if (isFocused) {
      if (!searchTerm) {
        return (
          <>
            {isLoggedIn && <RecentSearch onSelect={handleChange} />}
            {isLoggedIn && <AiConversationHistory onClick={handleClose} isLoggedIn={isLoggedIn} />}
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
          {!!data.teams?.length && <SearchResultsSection title="Teams" items={data.teams} query={searchTerm} onSelect={handleClose} />}
          {!!data.members?.length && <SearchResultsSection title="Members" items={data.members} query={searchTerm} onSelect={handleClose} />}
          {!!data.projects?.length && <SearchResultsSection title="Projects" items={data.projects} query={searchTerm} onSelect={handleClose} />}
          {!!data.events?.length && <SearchResultsSection title="Events" items={data.events} query={searchTerm} onSelect={handleClose} />}
        </>
      );
    } else {
      return <FullSearchResults searchTerm={searchTerm} onTryAiSearch={handleTryAiSearch} onClose={handleClose} />;
    }
  }

  return (
    <div className={s.root}>
      <button className={s.toggleButton} onClick={() => setOpen(true)}>
        <Image src="/icons/search-right.svg" alt="Search" width={20} height={20} />
      </button>
      {open && mode === 'regular' && (
        <div className={s.wrapper}>
          <div className={s.top}>
            <div className={s.header}>
              <SearchModeToggle active={mode} onChange={setMode} />
              <span className={s.title}>Search</span>
              <button className={s.closeButton} onClick={handleClose}>
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
      {open && mode === 'ai' && (
        <div className={s.wrapper}>
          <div className={s.top}>
            <div className={s.header}>
              <SearchModeToggle active={mode} onChange={setMode} />
              <span className={s.title}>AI Search</span>
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
          </div>
          <AiChatPanel className={s.mobileContent} initialPrompt={initialAiPrompt} mobileView isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
        </div>
      )}
    </div>
  );
};
