'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { clsx } from 'clsx';

import { Modal } from '@/components/common/Modal';
import { CloseIcon, ArrowUpRightIcon } from '@/components/icons';
import { CollapsibleSection } from '@/components/core/application-search/components/CollapsableSection';
import { ContentLoader } from '@/components/core/application-search/components/ContentLoader';
import { RecentSearch } from '@/components/core/application-search/components/RecentSearch';
import { SearchCategories } from '@/components/core/application-search/components/SearchCategories';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';
import { getGroupTitleByGroupName } from '@/components/core/application-search/components/SearchResultsSection/components/Top50Results/utils/getGroupTitleByGroupName';
import { useFullApplicationSearch } from '@/services/search/hooks/useFullApplicationSearch';
import { saveRecentSearch } from '@/services/search/hooks/useRecentSearch';
import { AI_SEARCH_SUGGESTIONS } from '@/services/search/constants';
import type { SearchResult } from '@/services/search/types';

import s from './AppSearchDialog.module.scss';

/**
 * Sections in a fixed order rather than production's length sort.
 *
 * `FullSearchResults`'s comparator only ever inspected `a.key === 'top'` and
 * never `b.key`, which made it non-transitive — but the deeper problem is that
 * a count-ordered list reshuffles under the cursor on every keystroke. A stable
 * order means the section you were reaching for is where you left it.
 */
const SECTION_ORDER: (keyof SearchResult)[] = ['top', 'members', 'teams', 'projects', 'forumThreads', 'events'];

/** Below this the AI row would offer to chat about a stray character. */
const MIN_ASK_LENGTH = 2;

export type DialogView = 'search' | 'answer' | 'history';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Full-bleed takeover below the two-column breakpoint. */
  fullBleed: boolean;
  /** The raw term — never debounced, so it always matches what is on screen. */
  rawTerm: string;
  onRawTermChange: (next: string) => void;
  /** The trailing-edge term the search query reads. */
  term: string;
  view: DialogView;
  onViewChange: (next: DialogView) => void;
  /** Where the answer state was reached from, so Back has somewhere to go. */
  origin: 'results' | 'history' | null;
  onAskAi: (question: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const AppSearchDialog = ({
  isOpen,
  onClose,
  fullBleed,
  rawTerm,
  onRawTermChange,
  term,
  view,
  onViewChange,
  origin,
  onAskAi,
  inputRef,
}: Props) => {
  const [activeCategory, setActiveCategory] = useState<keyof SearchResult | null>('top');

  const trimmed = rawTerm.trim();
  /* The view follows the *raw* term, so clearing the field returns to idle at
     once; only the fetch waits for the debounce. */
  const resolvedView: DialogView | 'idle' | 'results' =
    view === 'answer' || view === 'history' ? view : trimmed ? 'results' : 'idle';

  const { data, isLoading, isError } = useFullApplicationSearch(term);

  const total = useMemo(
    () =>
      SECTION_ORDER.filter((key) => key !== 'top').reduce((sum, key) => sum + (data?.[key]?.length ?? 0), 0),
    [data],
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onRawTermChange(e.target.value);
      setActiveCategory('top');
      /* Typing while reading an answer is a new search: the field is still the
         top of the dialog, so what you type in it has to win. The stream is
         left alone — it is the thread you can come back to. */
      if (view !== 'search') onViewChange('search');
    },
    [onRawTermChange, onViewChange, view],
  );

  const clearTerm = useCallback(() => {
    onRawTermChange('');
    setActiveCategory('top');
  }, [onRawTermChange]);

  /* A recent search is a search you *made*, not every prefix you typed on the
     way. This used to fire inside the query fetcher, so "f", "fi", "fil" and
     "file" all became entries against a three-item cap — one long question
     evicted the whole list. */
  const handleResultSelect = useCallback(() => {
    if (trimmed) saveRecentSearch(trimmed);
    onClose();
  }, [onClose, trimmed]);

  const askAi = useCallback(() => {
    if (trimmed.length < MIN_ASK_LENGTH) return;
    onAskAi(trimmed);
  }, [onAskAi, trimmed]);

  /**
   * One Escape ladder, on keydown, owned here.
   *
   * `Modal` listens on keydown/capture with `stopImmediatePropagation`, so it
   * is opted out (`closeOnEscape={false}`) rather than layered under — and
   * because the dialog owns its input, there is no second keyup handler
   * clearing the field behind our back.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();

      if (resolvedView === 'answer') {
        if (origin) onViewChange(origin === 'history' ? 'history' : 'search');
        else onClose();
        return;
      }
      if (resolvedView === 'history') {
        onViewChange('search');
        return;
      }
      if (resolvedView === 'results') {
        clearTerm();
        return;
      }
      onClose();
    },
    [clearTerm, onClose, onViewChange, origin, resolvedView],
  );

  /**
   * Focus the field one frame after the portal commits.
   *
   * `Modal` portals behind a `mounted` state and runs its `inertBackground`
   * sweep in its own post-commit effect — which lands *after* this child effect.
   * One `requestAnimationFrame` steps past that sweep. It is cancelable on
   * purpose: a bare `setTimeout` fires on a detached node when the dialog is
   * closed mid-animation, dropping focus to <body> and jumping the scroll.
   */
  useEffect(() => {
    if (!isOpen) return;
    let canceled = false;
    const id = requestAnimationFrame(() => {
      if (canceled) return;
      inputRef.current?.focus();
    });
    return () => {
      canceled = true;
      cancelAnimationFrame(id);
    };
  }, [isOpen, inputRef]);

  const renderIdle = () => (
    <div className={s.idle}>
      <RecentSearch onSelect={onRawTermChange} />

      <div className={s.section}>
        <div className={s.sectionLabel}>Try asking or searching for</div>
        <ul className={s.list}>
          {AI_SEARCH_SUGGESTIONS.map((suggestion) => (
            <li key={suggestion.text}>
              <button type="button" className={s.promptButton} onClick={() => onAskAi(suggestion.text)}>
                <Image className={s.promptIcon} src={suggestion.icon} alt="" width={20} height={20} />
                <span className={s.promptText}>{suggestion.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* Your AI Search History lands here — see Phase C. */}
    </div>
  );

  const renderResults = () => {
    if (isLoading) return <ContentLoader />;

    if (isError) {
      return <div className={s.noResults}>Something went wrong. Please try again.</div>;
    }

    if (!total) {
      return <div className={s.noResults}>No results for &ldquo;{rawTerm}&rdquo;</div>;
    }

    return (
      <>
        <div className={s.totalLabel}>Total results ({total})</div>
        <div className={s.sticky}>
          <SearchCategories data={data} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        </div>
        {SECTION_ORDER.map((key) => {
          const values = data?.[key];
          if (!values?.length) return null;
          if (activeCategory && key !== activeCategory) return null;
          const label = key === 'top' ? 'Top Results' : getGroupTitleByGroupName(key);
          return (
            <CollapsibleSection key={key} title={`${label} (${values.length})`} initialOpen forceOpen hideControl>
              <SearchResultsSection groupItems={key === 'top'} items={values} query={term} onSelect={handleResultSelect} />
            </CollapsibleSection>
          );
        })}
      </>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnEscape={false}
      lockScroll
      inertBackground
      overlayClassname={clsx(s.overlay, fullBleed && s.overlayFullBleed)}
      className={clsx(s.container, fullBleed && s.containerFullBleed)}
    >
      <div
        className={clsx(s.card, fullBleed && s.cardFullBleed)}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onKeyDown={handleKeyDown}
      >
        {/* The field is the top row of the card, not a control inside a padded
            header: the card is the box, so a second box inside it is chrome on
            chrome. It is a plain input rather than `DebouncedInput` — the delay
            lives on the derived query term instead, which is what keeps Enter,
            the AI row and Escape reading the same value the user sees. */}
        <div className={s.header}>
          <div className={s.field}>
            <Image className={s.fieldGlyph} src="/icons/search-right.svg" alt="" width={20} height={20} />
            <input
              ref={inputRef}
              className={s.fieldInput}
              type="text"
              value={rawTerm}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') askAi();
              }}
              placeholder="Search or ask AI Search a question"
              aria-label="Search or ask AI Search a question"
            />
            {!!rawTerm && (
              <button type="button" className={s.fieldClear} onClick={clearTerm} aria-label="Clear search">
                <Image src="/icons/close-gray.svg" alt="" width={20} height={20} />
              </button>
            )}
          </div>
          <button type="button" className={s.close} onClick={onClose} aria-label="Close search">
            <CloseIcon />
          </button>
        </div>

        {/* The one AI door, pinned above the list rather than at the end of it:
            results overflow the card at six hits, so a row inside the scroll
            would sit below the fold exactly when there is something to ask
            about. A band that never scrolls is in view at every scroll position
            and above "No results" alike. */}
        {resolvedView === 'results' && trimmed.length >= MIN_ASK_LENGTH && (
          <div className={s.askBar}>
            <button type="button" className={s.askRow} onClick={askAi}>
              <Image className={s.askGlyph} src="/icons/ai-search.svg" alt="" width={20} height={20} />
              <span className={s.askText}>Chat with AI Search about &ldquo;{rawTerm}&rdquo;</span>
              <span className={s.askArrow}>
                <ArrowUpRightIcon />
              </span>
            </button>
          </div>
        )}

        <div className={s.body}>{resolvedView === 'results' ? renderResults() : renderIdle()}</div>

        <div className={s.footer}>
          <span className={s.footerItem}>
            <kbd className={s.kbd}>⌘K</kbd> to open
          </span>
          <span className={s.footerItem}>
            <kbd className={s.kbd}>Esc</kbd> to close
          </span>
        </div>
      </div>
    </Modal>
  );
};
