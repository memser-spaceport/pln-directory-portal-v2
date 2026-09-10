'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
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
/* The answer state pulls in Markdown, which pulls in react-syntax-highlighter.
   This dialog lives in the navbar on every page, so a static import would put
   that whole tree in the first bundle every visitor downloads — for a state
   most of them never open. */
const AnswerView = dynamic(
  () => import('@/components/core/application-search/components/AnswerView').then((m) => m.AnswerView),
  { ssr: false },
);
import type { HuskyTurn, StreamStatus } from '@/services/husky/hooks/useHuskyChat';
import type { LimitLevel } from '@/services/husky/hooks/useDailyChatLimit';
import { AiSearchHistorySection } from '@/components/core/application-search/components/AiSearchHistorySection';
import { AI_SEARCH_SUGGESTIONS, MIN_ASK_LENGTH } from '@/services/search/constants';
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

interface ResultsBodyProps {
  term: string;
  rawTerm: string;
  activeCategory: keyof SearchResult | null;
  setActiveCategory: (next: keyof SearchResult | null) => void;
  onSelect: () => void;
}

/**
 * The results list, memoized and owning its own query.
 *
 * Both matter for the same reason: the chat engine lives above this dialog and
 * re-renders its host on every streamed token. Typing while an answer streams
 * is a supported flow, so without this boundary the whole result list would
 * re-render dozens of times a second against a stream it has nothing to do
 * with. Holding the query here also means the dialog above never subscribes to
 * search data it does not render.
 */
const ResultsBody = React.memo(function ResultsBody({
  term,
  rawTerm,
  activeCategory,
  setActiveCategory,
  onSelect,
}: ResultsBodyProps) {
  const { data, isLoading, isError } = useFullApplicationSearch(term);

  const total = SECTION_ORDER.filter((key) => key !== 'top').reduce((sum, key) => sum + (data?.[key]?.length ?? 0), 0);

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
      {/* `ResultsList` and its rows carry no inset of their own — the container
          they used to live in supplied it, so without this the rows and their
          full-width dividers run to the card's edge while the labels and chips
          above them sit at 16px. */}
      <div className={s.sections}>
        {SECTION_ORDER.map((key) => {
          const values = data?.[key];
          if (!values?.length) return null;
          if (activeCategory && key !== activeCategory) return null;
          const label = key === 'top' ? 'Top Results' : getGroupTitleByGroupName(key);
          return (
            <CollapsibleSection key={key} title={`${label} (${values.length})`} initialOpen forceOpen hideControl>
              <SearchResultsSection groupItems={key === 'top'} items={values} query={term} onSelect={onSelect} />
            </CollapsibleSection>
          );
        })}
      </div>
    </>
  );
});

export type DialogView = 'search' | 'answer' | 'history';

/**
 * Which screen the answer view was reached from — the one Back and Escape
 * return to.
 *
 * Not nullable, and deliberately: every door into the answer view comes from a
 * screen of this dialog, so "nowhere to go back to" was a state that could not
 * happen. It was reachable anyway, because the value was derived from whether
 * the search field had anything in it — which left both idle-view doors (a
 * suggested prompt, a row of the compact history list) with no Back at all and
 * an Escape that closed the whole dialog.
 *
 * `'restored'` is not a place anyone navigated from: it is the
 * reopened-with-a-thread case, a value rather than a separate flag because Back,
 * Escape and the composer autofocus all branch on this one field.
 */
export type AnswerOrigin = 'search' | 'results' | 'history' | 'restored';

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
  origin: AnswerOrigin;
  onAskAi: (question: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isLoggedIn: boolean;
  /** Resolves false when the thread could not be loaded. */
  onOpenThread: (threadId: string) => Promise<boolean>;
  /** "⌘K" or "Ctrl+K", decided once by the host so both hints agree. */
  shortcutLabel: string;
  chat: {
    turns: HuskyTurn[];
    status: StreamStatus;
    isBusy: boolean;
    threadId: string | null;
    isThreadPersisted: boolean;
    limitLevel: LimitLevel;
    limitRemaining: number;
    ask: (question: string) => void;
    regenerate: (question: string) => void;
    stop: () => void;
  };
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
  isLoggedIn,
  onOpenThread,
  shortcutLabel,
  chat,
}: Props) => {
  const [activeCategory, setActiveCategory] = useState<keyof SearchResult | null>('top');

  const trimmed = rawTerm.trim();
  /* The view follows the *raw* term, so clearing the field returns to idle at
     once; only the fetch waits for the debounce. */
  const resolvedView: DialogView | 'idle' | 'results' =
    view === 'answer' || view === 'history' ? view : trimmed ? 'results' : 'idle';

  /* Reopened straight into an existing thread. The person came back to continue
     it, so the caret belongs in the follow-up composer — not in the search
     field, whose first keystroke is treated as a brand new search and would
     navigate away from the thread that was just restored. */
  const restoringThread = resolvedView === 'answer' && origin === 'restored';

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

  const handleResultSelect = useCallback(() => {
    onClose();
  }, [onClose]);

  /**
   * A recent search is a search you *made*, not every prefix you typed on the
   * way — and with results appearing as you type and `Enter` asking the AI,
   * there is no submit gesture to read that from.
   *
   * The debounced term is the closest thing: it is what you stopped typing on,
   * and it is the value the search query itself runs on. The ladder that
   * produced it still arrives as several saves, so `saveRecentSearch` collapses
   * them — which is what lets this be recorded without a result ever being
   * clicked, and without one typed query filling a three-item list.
   *
   * Floored at the same length the dialog uses to decide it has a query at all.
   * A term abandoned inside the debounce window never settles, so a discarded
   * typo is never recorded.
   */
  useEffect(() => {
    const settled = term.trim();
    if (settled.length >= MIN_ASK_LENGTH) {
      saveRecentSearch(settled);
    }
  }, [term]);

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
        onViewChange(origin === 'history' ? 'history' : 'search');
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
    /* A reopened conversation focuses its own composer instead — see the note
       on `autoFocusComposer` below. Skipped here rather than raced: two rAF
       callbacks aiming at different nodes in the same frame is decided by
       ordering, which is not a thing to rely on. */
    if (restoringThread) return;
    let canceled = false;
    const id = requestAnimationFrame(() => {
      if (canceled) return;
      inputRef.current?.focus();
    });
    return () => {
      canceled = true;
      cancelAnimationFrame(id);
    };
  }, [isOpen, inputRef, restoringThread]);

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
      <AiSearchHistorySection
        mode="compact"
        isLoggedIn={isLoggedIn}
        onOpenThread={onOpenThread}
        onShowAll={() => onViewChange('history')}
        onCloseFull={() => onViewChange('search')}
      />

      {/* Says what the field reaches. It earns its place most in the states the
          rest of this view leaves thin — no history yet, still loading, signed
          out — so it is not tied to any of them. */}
      <p className={s.hint}>Search members, teams, projects, events and forum posts, or chat with AI Search.</p>
    </div>
  );

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
                <Image src="/icons/close-gray.svg" alt="" width={16} height={16} />
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

        {resolvedView === 'answer' ? (
          <AnswerView
            turns={chat.turns}
            status={chat.status}
            isBusy={chat.isBusy}
            threadId={chat.threadId}
            isThreadPersisted={chat.isThreadPersisted}
            limitLevel={chat.limitLevel}
            limitRemaining={chat.limitRemaining}
            isLoggedIn={isLoggedIn}
            autoFocusComposer={restoringThread}
            onBack={() => onViewChange(origin === 'history' ? 'history' : 'search')}
            backLabel={
              origin === 'history' ? 'Back to history' : origin === 'results' ? 'Back to results' : 'Back to search'
            }
            onAsk={chat.ask}
            onRegenerate={chat.regenerate}
            onStop={chat.stop}
            onClose={onClose}
          />
        ) : (
          <div className={s.body}>
            {resolvedView === 'history' ? (
              <AiSearchHistorySection
                mode="full"
                isLoggedIn={isLoggedIn}
                onOpenThread={onOpenThread}
                onShowAll={() => onViewChange('history')}
                onCloseFull={() => onViewChange('search')}
              />
            ) : resolvedView === 'results' ? (
              <ResultsBody
                term={term}
                rawTerm={rawTerm}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                onSelect={handleResultSelect}
              />
            ) : (
              renderIdle()
            )}
          </div>
        )}

        <div className={s.footer}>
          <span className={s.footerItem}>
            <kbd className={s.kbd}>{shortcutLabel}</kbd> to open
          </span>
          <span className={s.footerItem}>
            <kbd className={s.kbd}>Esc</kbd> to close
          </span>
        </div>
      </div>
    </Modal>
  );
};
