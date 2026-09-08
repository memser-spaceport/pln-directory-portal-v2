'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

import { Modal } from '@/components/common/Modal';
import { CloseIcon, ArrowUpRightIcon } from '@/components/icons';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import { SearchCategories } from '@/components/core/application-search/components/SearchCategories';
import { CollapsibleSection } from '@/components/core/application-search/components/CollapsableSection';
import { SearchResultsSection } from '@/components/core/application-search/components/SearchResultsSection';
import { getGroupTitleByGroupName } from '@/components/core/application-search/components/SearchResultsSection/components/Top50Results/utils/getGroupTitleByGroupName';
import type { SearchResult } from '@/services/search/types';

// Production stylesheets, imported so the new rows sit in production's list.
import shell from '../nav-shared/PrototypeSearchModal.module.scss';
import fsr from '@/components/core/application-search/components/FullSearchResults/FullSearchResults.module.scss';
import rs from '@/components/core/application-search/components/RecentSearch/RecentSearch.module.scss';
import tt from '@/components/core/application-search/components/TryToSearch/TryToSearch.module.scss';
import rl from '@/components/core/application-search/components/SearchResultsSection/components/ResultsList/ResultsList.module.scss';

import { AnswerPanel, makeTurn, type Turn } from './AnswerPanel';
import { countResults, RECENT_SEARCHES, searchCorpus, SUGGESTED_PROMPTS } from './mocks';
import s from './AiSearchModal.module.scss';

const INPUT_ID = 'ai-search-input';

interface AiSearchModalProps {
  open: boolean;
  onClose: () => void;
}

const SECTION_ORDER: (keyof SearchResult)[] = ['top', 'members', 'teams', 'projects', 'forumThreads', 'events'];

/**
 * The header search dialog with AI as a **row and a state**, not a column.
 *
 * Production's overlay is a two-column grid: keyword results left, `AiChatPanel`
 * right, at rest — two inputs competing on one surface, and an AI empty state
 * that is a wordless gradient cube. No reference product does that; Mintlify
 * and Otter end (or lead) the one results list with an "Ask AI about '<term>'"
 * row, and the answer takes the panel when pressed. That is what this is.
 *
 * Three states, one dialog:
 *  - **idle** — Recent + "Try asking or searching for" (the Husky page's own
 *    prompt block, with prompts phrased as directory finds) + the scope hint.
 *  - **results** — production's category chips and result rows over a mocked
 *    corpus, and one row pinned under the list: *Ask Husky about "<term>"*.
 *    That row replaces both of production's AI doors (the `NothingFound` card
 *    that only appears at zero results, and the `TryAiSearch` button that is
 *    commented out at every call site). At zero results the same row sits
 *    under the fact. The field's placeholder names both jobs — "Search or ask
 *    Husky a question" — because the row only exists once there is a term.
 *  - **answer** — `AnswerPanel`, with Back to results and Continue in Husky.
 *
 * Chrome is the sibling `PrototypeSearchModal`'s stylesheet, imported, so the
 * two dialogs cannot drift. Everything is mocked; nothing is fetched.
 *
 * One deliberate fix over production: section titles use the Title Case
 * helper production's own Top50 grouping already uses (`getGroupTitleByGroupName`)
 * — `FullSearchResults.getLabel` falls through to the raw key and renders
 * "members" beside a "Members" chip.
 */
export function AiSearchModal({ open, onClose }: AiSearchModalProps) {
  const [term, setTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof SearchResult | null>('top');
  const [view, setView] = useState<'search' | 'answer'>('search');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [recent, setRecent] = useState(RECENT_SEARCHES);
  /** Whether the answer was reached from a result list (so Back has somewhere to go). */
  const [cameFromResults, setCameFromResults] = useState(false);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => document.getElementById(INPUT_ID)?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const results = useMemo(() => (term ? searchCorpus(term) : undefined), [term]);
  const total = results ? countResults(results) : 0;

  /* Typing again while reading an answer is a new search: the field is still
     the top of the dialog, so what you type in it has to win. */
  const handleTermChange = useCallback((next: string) => {
    setTerm(next);
    setActiveCategory('top');
    if (next) setView('search');
  }, []);

  const reset = () => {
    setTerm('');
    setActiveCategory('top');
    setView('search');
    setTurns([]);
    setCameFromResults(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const ask = useCallback((question: string) => {
    setTurns((prev) => [...prev, makeTurn(question)]);
    setView('answer');
  }, []);

  const askFromResults = () => {
    setCameFromResults(true);
    setTurns([makeTurn(term)]);
    setView('answer');
  };

  const askFromIdle = (q: string) => {
    setCameFromResults(false);
    setTurns([makeTurn(q)]);
    setView('answer');
  };

  const showAnswer = view === 'answer' && turns.length > 0;

  return (
    <Modal isOpen={open} onClose={handleClose} overlayClassname={shell.overlay} className={shell.container} lockScroll>
      <div className={shell.card} role="dialog" aria-modal="true" aria-label="Search">
        <div className={shell.header}>
          <div className={shell.field}>
            <DebouncedInput
              ids={{ root: `${INPUT_ID}-root`, input: INPUT_ID }}
              value={term}
              onChange={handleTermChange}
              /* The field has two jobs and the placeholder is the only thing
                 that says so at rest: "Search" alone reads as keywords-only,
                 and the AI door then looks like it lives in the suggestions.
                 Evernote and Mintlify both label theirs "Search or ask". */
              placeholder="Search or ask Husky a question"
              flushIcon={<Image src="/icons/search-right.svg" alt="Search" width={20} height={20} />}
            />
          </div>
          <button type="button" className={shell.close} onClick={handleClose} aria-label="Close search">
            <CloseIcon />
          </button>
        </div>

        {showAnswer ? (
          /* The answer owns its own scroll region (thread scrolls, input stays),
             so it sits beside `shell.body` rather than inside it. */
          <div className={s.answerBody}>
            <AnswerPanel
              turns={turns}
              onTurnsChange={setTurns}
              onAsk={ask}
              onBackToResults={cameFromResults && term ? () => setView('search') : undefined}
            />
          </div>
        ) : (
          <div className={shell.body}>
            {term && results ? (
              <div className={fsr.root}>
                {total > 0 && (
                  <>
                    <div className={fsr.totalFoundLabel}>Total results ({total})</div>
                    {/* Production's `.sticky` offsets 40px for an overlay header
                      this dialog doesn't have, and paints `--Neutral-White`,
                      which is undefined here — rows scrolled straight through
                      the chips. Pinned to 0 on a real white. */}
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
                      const label = key === 'top' ? 'Top Results' : getGroupTitleByGroupName(key);
                      return (
                        <CollapsibleSection
                          key={key}
                          title={`${label} (${values.length})`}
                          initialOpen
                          forceOpen
                          hideControl
                        >
                          <SearchResultsSection
                            groupItems={key === 'top'}
                            items={values}
                            query={term}
                            onSelect={handleClose}
                          />
                        </CollapsibleSection>
                      );
                    })}
                  </>
                )}

                {total === 0 && <div className={clsx(rl.label, s.noResults)}>No results for &ldquo;{term}&rdquo;</div>}
              </div>
            ) : (
              <div className={shell.idle}>
                {recent.length > 0 && (
                  <>
                    <div className={rs.root}>
                      <div className={rs.label}>Recent</div>
                      <ul className={rs.list}>
                        {recent.map((item) => (
                          <li key={item} className={rs.searchItem} onClick={() => handleTermChange(item)}>
                            <span className={rs.searchItemText}>{item}</span>
                            <button
                              type="button"
                              className={rs.removeButton}
                              aria-label={`Remove ${item} from recent searches`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRecent((prev) => prev.filter((r) => r !== item));
                              }}
                            >
                              <Image src="/icons/close-gray.svg" alt="" width={20} height={20} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={rs.divider} />
                  </>
                )}

                {/* The Husky page's own prompt block ("Try asking or searching
                  for"), in the overlay's `TryToSearch` row style. */}
                <div className={tt.root}>
                  <div className={tt.label}>Try asking or searching for</div>
                  <ul className={tt.list}>
                    {SUGGESTED_PROMPTS.map((p) => (
                      <li key={p.text}>
                        <button
                          type="button"
                          className={clsx(tt.suggestionButton, s.promptButton)}
                          onClick={() => askFromIdle(p.text)}
                        >
                          <img src={p.icon} alt="" className={s.promptIcon} />
                          {p.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className={clsx(shell.hint, s.hintInset)}>
                  Search members, teams, projects, events and forum posts, or ask Husky.
                </p>
              </div>
            )}
          </div>
        )}

        {/* The one AI door, pinned under the list rather than at the end of
            it. It was the last row of the results first — and results
            overflow a 640px card at six hits, so the door was below the fold
            exactly when there was something to ask about. A band that never
            scrolls is visible at every scroll position and in the zero-results
            state alike. */}
        {term && !showAnswer && (
          <div className={s.askBar}>
            <AskRow term={term} onClick={askFromResults} />
          </div>
        )}

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
}

/**
 * The row that stands in for production's two AI doors. Same row shape as
 * Recent (`RecentSearch .searchItem`), so it reads as one more thing in the
 * list rather than a framed card interrupting it — the `NothingFound` card's
 * blue-ring box is an announcement, and this is a choice.
 */
function AskRow({ term, onClick }: { term: string; onClick: () => void }) {
  return (
    /* `rs.root` stays as the host because RecentSearch nests `.searchItem` and
       `.searchItemText` under it — outside the wrapper neither class applies.
       Its own margin/padding are zeroed so the band sets the inset.
       No section label: the row names itself, and "Ask Husky" over
       "Ask Husky about …" said it twice. */
    <div className={clsx(rs.root, s.askRowHost)}>
      <button type="button" className={clsx(rs.searchItem, s.rowButton)} onClick={onClick}>
        <Image src="/icons/ai-search.svg" alt="" width={20} height={20} className={s.rowIcon} />
        <span className={rs.searchItemText}>Ask Husky about &ldquo;{term}&rdquo;</span>
        <span className={s.askArrow} aria-hidden="true">
          <ArrowUpRightIcon />
        </span>
      </button>
    </div>
  );
}
