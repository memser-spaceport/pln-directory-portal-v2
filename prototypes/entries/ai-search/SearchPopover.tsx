'use client';

import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { Modal } from '@/components/common/Modal';
import { CloseIcon, ArrowUpRightIcon } from '@/components/icons';
import { SearchCategories } from '@/components/core/application-search/components/SearchCategories';
import { CollapsibleSection } from '@/components/core/application-search/components/CollapsableSection';
import { getGroupTitleByGroupName } from '@/components/core/application-search/components/SearchResultsSection/components/Top50Results/utils/getGroupTitleByGroupName';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';
import type { FoundItem, SearchResult } from '@/services/search/types';

// Production stylesheets, imported so the rows sit in production's list.
import fsr from '@/components/core/application-search/components/FullSearchResults/FullSearchResults.module.scss';
import rs from '@/components/core/application-search/components/RecentSearch/RecentSearch.module.scss';
import rl from '@/components/core/application-search/components/SearchResultsSection/components/ResultsList/ResultsList.module.scss';

import { SearchField } from './SearchField';
import { ResultRows } from './ResultRows';
import { countResults, RECENT_SEARCHES, searchCorpus } from './mocks';
import s from './SearchPopover.module.scss';

const INPUT_ID = 'search-popover-input';

const SECTION_ORDER: (keyof SearchResult)[] = ['top', 'members', 'teams', 'projects', 'forumThreads', 'events'];

interface SearchPopoverProps {
  open: boolean;
  onClose: () => void;
  /** Owned by the host, so the AI view's Back can reopen this with the term intact. */
  term: string;
  onTermChange: (term: string) => void;
  /** The AI row. With a term it hands the term over; without one it opens the AI view empty. */
  onAskAi: (term: string) => void;
  /** A team or member row's "Ask AI": opens the AI view with that record as the scope chip. */
  onAskAbout: (item: FoundItem) => void;
  /** The header control this hangs under. Measured on open. */
  anchor: () => HTMLElement | null;
}

/**
 * General search as a **popover under the header field**, not a takeover.
 *
 * What people type here is team names and first names (the usage data), and
 * what they do with the result is pick a row and leave: a lookup. Notion,
 * Linear and GitHub size a lookup as a card hanging off the field — ~640px,
 * capped short of the fold, the list scrolling inside — and keep the page in
 * view behind it. The takeover this replaced was earned by the AI answer, and
 * the keyword list got dragged along; the answer now has its own surface
 * (`AiSearchView`), and this one is the size of its job.
 *
 * One door stays: the AI row, pinned above the results (or standing alone at
 * rest), which grows into the AI view with the term carried over — Mintlify's
 * and Otter's small-search-then-answer move. The row's job at rest is to say
 * the offer exists before anything is typed (lesson 4's fifth example); the
 * placeholder says it too. Team and member rows add a second, quieter door
 * as a visible **Ask AI** action that opens the view scoped to *that record* rather
 * than to the words typed (see `ResultRows`).
 *
 * On phones it is the full-bleed sheet the takeover was: a card in a 12px
 * gutter is a worse phone dialog than a sheet, and the anchor has no meaning
 * there. Everything is mocked; nothing is fetched.
 */
export function SearchPopover({
  open,
  onClose,
  term,
  onTermChange,
  onAskAi,
  onAskAbout,
  anchor,
}: SearchPopoverProps) {
  const [activeCategory, setActiveCategory] = useState<keyof SearchResult | null>('top');
  const [recent, setRecent] = useState(RECENT_SEARCHES);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  /* Anchored to the header control it opened from: its bottom edge plus 8px,
     right-aligned to its right edge. Re-measured on open; the header is
     sticky, so it holds while the page scrolls. */
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = anchor();
      if (!el) return setPos(null);
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    };
    measure();
    window.addEventListener('resize', measure);
    /* A term kept from the last visit opens selected, so the next keystroke
       replaces it: the words are there to read or re-run, never to delete
       first. Nothing typed yet, nothing to select. */
    const raf = requestAnimationFrame(() => {
      const input = document.getElementById(INPUT_ID) as HTMLInputElement | null;
      input?.focus();
      if (input?.value) input.select();
    });
    return () => {
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
    };
  }, [open, anchor]);

  const results = useMemo(() => (term ? searchCorpus(term) : undefined), [term]);
  const total = results ? countResults(results) : 0;

  const handleTermChange = (next: string) => {
    onTermChange(next);
    setActiveCategory('top');
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      overlayClassname={s.overlay}
      overlayStyle={
        pos ? ({ '--pop-top': `${pos.top}px`, '--pop-right': `${pos.right}px` } as React.CSSProperties) : undefined
      }
      className={s.container}
    >
      <div className={s.card} role="dialog" aria-modal="true" aria-label="Search">
        <SearchField
          id={INPUT_ID}
          value={term}
          onChange={handleTermChange}
          /* The field has two jobs and the placeholder is the only thing that
             says so at rest (Evernote and Mintlify: "Search or ask"). */
          placeholder="Search or ask AI Search a question"
          onClose={onClose}
          closeLabel="Close search"
        />

        {/* The one AI door, above the list at every scroll position. At rest
            it names the offer; with a term it names the term. */}
        <div className={s.askBar}>
          <div className={clsx(rs.root, s.askRowHost)}>
            <button type="button" className={clsx(rs.searchItem, s.rowButton)} onClick={() => onAskAi(term)}>
              <AiSearchIcon className={s.rowIcon} />
              <span className={rs.searchItemText}>
                {term ? (
                  <>
                    Chat with AI Search about &ldquo;{term}&rdquo;
                  </>
                ) : (
                  'Ask AI Search a question'
                )}
              </span>
              <span className={s.askArrow} aria-hidden="true">
                <ArrowUpRightIcon />
              </span>
            </button>
          </div>
        </div>

        <div className={s.body}>
          {term && results ? (
            <div className={fsr.root}>
              {total > 0 && (
                <>
                  <div className={fsr.totalFoundLabel}>Total results ({total})</div>
                  {/* Production's `.sticky` offsets 40px for an overlay header
                      this card doesn't have, and paints `--Neutral-White`,
                      which is undefined here. Pinned to 0 on a real white. */}
                  <div className={clsx(fsr.sticky, s.stickyTop)}>
                    <SearchCategories
                      data={results}
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                    />
                  </div>
                  {SECTION_ORDER.map((key) => {
                    const values = results[key];
                    if (!values?.length) return null;
                    if (activeCategory && key !== activeCategory) return null;
                    /* Title Case via production's own Top50 helper —
                       `FullSearchResults.getLabel` renders "members" beside a
                       "Members" chip. */
                    const label = key === 'top' ? 'Top Results' : getGroupTitleByGroupName(key);
                    return (
                      <CollapsibleSection
                        key={key}
                        title={`${label} (${values.length})`}
                        initialOpen
                        forceOpen
                        hideControl
                      >
                        <ResultRows
                          grouped={key === 'top'}
                          items={values}
                          onSelect={onClose}
                          onAskAbout={onAskAbout}
                        />
                      </CollapsibleSection>
                    );
                  })}
                </>
              )}
              {total === 0 && <div className={clsx(rl.label, s.noResults)}>No results for &ldquo;{term}&rdquo;</div>}
            </div>
          ) : (
            <div className={s.idle}>
              {recent.length > 0 && (
                <div className={clsx(rs.root, s.idleSection)}>
                  <div className={rs.label}>Recent</div>
                  <ul className={rs.list}>
                    {recent.map((item) => (
                      <li key={item} className={rs.searchItem} onClick={() => handleTermChange(item)}>
                        <span className={rs.searchItemText}>{item}</span>
                        <button
                          type="button"
                          className={clsx(rs.removeButton, s.recentRemove)}
                          aria-label={`Remove ${item} from recent searches`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecent((prev) => prev.filter((r) => r !== item));
                          }}
                        >
                          {/* The DS `CloseIcon`, not production's `/icons/close-gray.svg`
                              (Tailwind slate baked in); one drawing of one mark. */}
                          <CloseIcon />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className={s.hint}>Search members, teams, projects, events and forum posts.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
