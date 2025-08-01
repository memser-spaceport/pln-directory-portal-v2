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
        <SearchIcon />
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

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.9421 17.0577L14.0304 13.1468C15.1642 11.7856 15.7295 10.0398 15.6089 8.27238C15.4882 6.505 14.6908 4.85217 13.3825 3.65772C12.0743 2.46328 10.3559 1.8192 8.58486 1.85944C6.81382 1.89969 5.12647 2.62118 3.87383 3.87383C2.62118 5.12647 1.89969 6.81382 1.85944 8.58486C1.8192 10.3559 2.46328 12.0743 3.65772 13.3825C4.85217 14.6908 6.505 15.4882 8.27238 15.6089C10.0398 15.7295 11.7856 15.1642 13.1468 14.0304L17.0577 17.9421C17.1158 18.0002 17.1848 18.0463 17.2606 18.0777C17.3365 18.1091 17.4178 18.1253 17.4999 18.1253C17.5821 18.1253 17.6634 18.1091 17.7392 18.0777C17.8151 18.0463 17.8841 18.0002 17.9421 17.9421C18.0002 17.8841 18.0463 17.8151 18.0777 17.7392C18.1091 17.6634 18.1253 17.5821 18.1253 17.4999C18.1253 17.4178 18.1091 17.3365 18.0777 17.2606C18.0463 17.1848 18.0002 17.1158 17.9421 17.0577ZM3.12493 8.74993C3.12493 7.63741 3.45483 6.54988 4.07292 5.62485C4.691 4.69982 5.56951 3.97885 6.59734 3.55311C7.62517 3.12737 8.75617 3.01598 9.84732 3.23302C10.9385 3.45006 11.9407 3.98579 12.7274 4.77246C13.5141 5.55913 14.0498 6.56141 14.2669 7.65255C14.4839 8.74369 14.3725 9.87469 13.9468 10.9025C13.521 11.9304 12.8 12.8089 11.875 13.427C10.95 14.045 9.86245 14.3749 8.74993 14.3749C7.2586 14.3733 5.82882 13.7801 4.77429 12.7256C3.71975 11.671 3.12659 10.2413 3.12493 8.74993Z"
      fill="#455468"
    />
  </svg>
);
