'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { SearchInput } from '@/components/common/filters/SearchInput/SearchInput';
import { CloseIcon } from '@/components/core/UpdatesPanel/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { useTeamNewsByTeamInfinite } from '@/services/team-news/hooks/useTeamNewsByTeam';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { TeamNewsCard } from './TeamNewsCard';
import s from './TeamNewsRail.module.scss';

interface TeamNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamUid: string;
  teamName: string;
  total: number;
  fullscreen?: boolean;
}

export function TeamNewsModal({ isOpen, onClose, teamUid, teamName, total, fullscreen = false }: TeamNewsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const effectiveQuery = searchQuery === '' ? '' : debouncedQuery;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { onTeamNewsCardClicked } = useTeamNewsAnalytics();

  const { items, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useTeamNewsByTeamInfinite({
    teamUid,
    q: effectiveQuery,
    enabled: isOpen,
  });

  const handleClose = useCallback(() => {
    onClose();
    setSearchQuery('');
  }, [onClose]);

  const handleCardClick = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsCardClicked(item, position);
    },
    [onTeamNewsCardClicked],
  );

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !fullscreen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen, isOpen]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: sentinel.parentElement, rootMargin: '120px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isOpen, items.length, debouncedQuery]);

  const feedContent = isLoading ? (
    <div className={s.modalLoading}>Loading news…</div>
  ) : items.length > 0 ? (
    <>
      <div className={fullscreen ? s.newsPageList : s.modalGrid}>
        {items.map((item, index) => (
          <TeamNewsCard
            key={item.uid}
            item={item}
            position={index}
            variant="outline"
            onClick={(clicked) => handleCardClick(clicked, index)}
          />
        ))}
      </div>
      <div ref={sentinelRef} className={s.modalSentinel} aria-hidden="true" />
      {isFetchingNextPage && <div className={s.modalLoading}>Loading more…</div>}
    </>
  ) : (
    <div className={fullscreen ? s.newsPageEmpty : s.modalEmpty}>
      {debouncedQuery ? `No news matches “${effectiveQuery}”.` : 'No news found.'}
    </div>
  );

  if (fullscreen) {
    if (!isOpen) return null;

    return (
      <div className={s.newsPage}>
        <div className={s.newsPageHeader}>
          <div className={s.newsPageTitleRow}>
            <h2 className={s.newsPageTitle}>{teamName} News</h2>
            {total > 0 && (
              <div className={s.newsPageBadge}>
                <span className={s.newsPageBadgeText}>{total}</span>
              </div>
            )}
          </div>
          <button type="button" className={s.newsPageClose} onClick={handleClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={s.newsPageSearch}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search news by keyword or type"
          />
        </div>

        {feedContent}
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={s.newsModal}>
      <div className={s.modalHeader}>
        <span className={s.modalTitle}>
          {teamName} News ({total})
        </span>
        <button type="button" className={s.modalClose} onClick={handleClose} aria-label="Close">
          <ModalCloseIcon />
        </button>
      </div>
      <div className={s.modalSearchWrap}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search news by keyword or type"
        />
      </div>
      <div className={s.modalBody}>{feedContent}</div>
    </Modal>
  );
}

const ModalCloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 5L5 15M5 5l10 10"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
