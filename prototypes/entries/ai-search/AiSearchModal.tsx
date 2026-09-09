'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { format, getYear, isToday, isYesterday, subDays, subMonths, subWeeks } from 'date-fns';

import { Modal } from '@/components/common/Modal';
// Production's own history chrome: the subheader that toggles the list in the
// AI column (clock glyph, "Your AI Search History", Close) — import-safe, no
// hooks — and the list's stylesheet (date-group label, 36px row).
import { ChatSubheader } from '@/components/core/application-search/components/AiChatPanel/components/ChatSubheader/ChatSubheader';
import ch from '@/components/core/application-search/components/AiChatPanel/components/ChatHistory/ChatHistory.module.scss';
import sub from '@/components/core/application-search/components/AiChatPanel/components/ChatSubheader/ChatSubheader.module.scss';
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
import { CHAT_HISTORY_SEED, countResults, RECENT_SEARCHES, searchCorpus, SUGGESTED_PROMPTS } from './mocks';
import s from './AiSearchModal.module.scss';

const INPUT_ID = 'ai-search-input';

interface AiSearchModalProps {
  open: boolean;
  onClose: () => void;
}

const SECTION_ORDER: (keyof SearchResult)[] = ['top', 'members', 'teams', 'projects', 'forumThreads', 'events'];

/** One AI Search conversation. Its title is its first question. */
interface ChatThread {
  id: number;
  createdAt: Date;
  turns: Turn[];
}

let nextThreadId = 1;

/** Seeded history: canned questions already answered, newest first. */
function seedThreads(): ChatThread[] {
  return CHAT_HISTORY_SEED.map(({ questions, daysAgo }) => ({
    id: nextThreadId++,
    createdAt: subDays(new Date(), daysAgo),
    turns: questions.map((q) => {
      const t = makeTurn(q);
      return { ...t, shown: t.answer, status: 'done' as const };
    }),
  }));
}

/** Production's history buckets (Today / Yesterday), then a date. */
function whenLabel(d: Date) {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

/** How many past threads the idle state lists; "Show all" opens the rest in place. */
const HISTORY_ROWS = 5;

/**
 * Production's `ChatHistory` buckets for the full list: Today, Yesterday,
 * Last 7 days, Last 30 days, then a year. One deviation, on purpose: production
 * files a thread older than 30 days under its year only when that year is a
 * *past* one, so a thread from two months ago this year lands in no group and
 * is not drawn at all. Here it gets the current year's label — the least
 * invented place for it, and the one production would give it in January.
 */
const HISTORY_FIXED_GROUPS = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days'];

function historyGroup(d: Date, now: Date): string {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (d > subWeeks(now, 1)) return 'Last 7 days';
  if (d > subMonths(now, 1)) return 'Last 30 days';
  return String(getYear(d));
}

/** Threads by bucket, fixed buckets first, then years newest first. */
function groupHistory(threads: ChatThread[]): Array<[string, ChatThread[]]> {
  const now = new Date();
  const groups = new Map<string, ChatThread[]>();
  for (const thread of threads) {
    const key = historyGroup(thread.createdAt, now);
    groups.set(key, [...(groups.get(key) ?? []), thread]);
  }
  const years = [...groups.keys()]
    .filter((k) => !HISTORY_FIXED_GROUPS.includes(k))
    .sort((a, b) => Number(b) - Number(a));
  return [...HISTORY_FIXED_GROUPS, ...years]
    .filter((k) => groups.has(k))
    .map((k) => [k, groups.get(k)!.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())]);
}

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
 *  - **idle** — Recent, then "Try asking or searching for" (the Husky page's
 *    own prompt block, with prompts phrased as directory finds), then **Your
 *    AI Search History** (production's own label and row lineage, from
 *    `ChatHistory` — but as one section of the one list rather than behind a
 *    toggle in an AI column) + the scope hint. A history row reopens the
 *    thread in place, follow-ups and all. Five rows; a **Show all (N)** door
 *    on the label opens the rest.
 *  - **history** — the whole record, in production's `ChatSubheader` +
 *    `ChatHistory` grammar: the subheader with its Close, then the threads
 *    under production's date groups (Today / Yesterday / Last 7 days / Last
 *    30 days / year). In the dialog rather than out on the AI Search page,
 *    because a past thread opens *here*, in place, and the page would cost
 *    the person their search to reach a list they can already read.
 *  - **results** — one row pinned **above** the list — *Chat with AI Search
 *    about "<term>"* — then production's category chips and result rows over
 *    a mocked corpus. That row replaces both of production's AI doors (the
 *    `NothingFound` card that only appears at zero results, and the
 *    `TryAiSearch` button that is commented out at every call site). At zero
 *    results the same row sits above the fact. The field's placeholder names
 *    both jobs — "Search or ask AI Search a question" — because the row only
 *    exists once there is a term. The feature is named "AI Search" everywhere
 *    a person reads it (production's own label in `ChatPanelHeader`,
 *    `AppSearchMobile`, `NothingFound`, `TryAiSearch`); "Husky" stays a
 *    component name.
 *  - **answer** — `AnswerPanel`, with Back to results and Continue in AI Search.
 *
 * Threads are the source of truth for the answer state: the open thread's
 * turns are what `AnswerPanel` edits, so closing the dialog keeps the chat —
 * it is the newest row under history when the dialog opens again, and a
 * thread closed mid-stream picks the stream back up when reopened.
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
  const [view, setView] = useState<'search' | 'answer' | 'history'>('search');
  const [threads, setThreads] = useState<ChatThread[]>(seedThreads);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [recent, setRecent] = useState(RECENT_SEARCHES);

  const turns = useMemo(() => threads.find((t) => t.id === activeThreadId)?.turns ?? [], [threads, activeThreadId]);

  /* AnswerPanel edits the open thread's turns in place, so history is kept by
     construction rather than copied out on close. */
  const setTurns = useCallback(
    (next: Turn[] | ((prev: Turn[]) => Turn[])) => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId ? { ...t, turns: typeof next === 'function' ? next(t.turns) : next } : t,
        ),
      );
    },
    [activeThreadId],
  );
  /** Which list the answer was reached from, so Back has somewhere to go — and a name. */
  const [origin, setOrigin] = useState<'results' | 'history' | null>(null);

  const groupedHistory = useMemo(() => groupHistory(threads), [threads]);

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

  /* Close leaves the threads alone: the chat you were in is the first history
     row next time. Only the dialog's own position resets. */
  const reset = () => {
    setTerm('');
    setActiveCategory('top');
    setView('search');
    setActiveThreadId(null);
    setOrigin(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  /* A follow-up in the open thread. */
  const ask = useCallback(
    (question: string) => {
      setTurns((prev) => [...prev, makeTurn(question)]);
      setView('answer');
    },
    [setTurns],
  );

  /* A new thread, newest first in history. */
  const startThread = (question: string) => {
    const thread: ChatThread = { id: nextThreadId++, createdAt: new Date(), turns: [makeTurn(question)] };
    setThreads((prev) => [thread, ...prev]);
    setActiveThreadId(thread.id);
    setView('answer');
  };

  const askFromResults = () => {
    setOrigin('results');
    startThread(term);
  };

  const askFromIdle = (q: string) => {
    setOrigin(null);
    startThread(q);
  };

  /* From the idle rows there is nothing to go back to but the idle state
     itself; from the full list, Back returns to the list. */
  const openThread = (thread: ChatThread, from: 'history' | null = null) => {
    setOrigin(from);
    setActiveThreadId(thread.id);
    setView('answer');
  };

  const showAnswer = view === 'answer' && turns.length > 0;

  return (
    <Modal isOpen={open} onClose={handleClose} overlayClassname={shell.overlay} className={shell.container} lockScroll>
      <div className={shell.card} role="dialog" aria-modal="true" aria-label="Search">
        {/* The field is the top row of the card, not a form field inside a
            padded header. Every palette in the reference set (ClickUp,
            Magnific, Notion, Dovetail, Devin, Supabase, Ferndesk on Mobbin)
            draws it this way: a borderless input with the search glyph on the
            left, larger type, a hairline under it, and only the clear on the
            right — the card is the box, so a second box inside it is chrome
            on chrome. Production's `DebouncedInput` is still the component
            (its debounce, Enter/Escape and clear behaviour), restyled through
            its own `classes` hooks; the shared shell stays as it is for the
            sibling dialog. */}
        <div className={clsx(shell.header, s.headerBar)}>
          <div className={shell.field}>
            <DebouncedInput
              ids={{ root: `${INPUT_ID}-root`, input: INPUT_ID }}
              value={term}
              onChange={handleTermChange}
              /* The field has two jobs and the placeholder is the only thing
                 that says so at rest: "Search" alone reads as keywords-only,
                 and the AI door then looks like it lives in the suggestions.
                 Evernote and Mintlify both label theirs "Search or ask". */
              placeholder="Search or ask AI Search a question"
              flushIcon={<Image src="/icons/search-right.svg" alt="Search" width={20} height={20} />}
              classes={{ root: s.fieldRoot, input: s.fieldInput, flushBtn: s.fieldFlush, clearBtn: s.fieldClear }}
            />
          </div>
          <button type="button" className={shell.close} onClick={handleClose} aria-label="Close search">
            <CloseIcon />
          </button>
        </div>

        {/* The one AI door, pinned above the list rather than at the end of
            it. It was the last row of the results first — and results
            overflow a 640px card at six hits, so the door was below the fold
            exactly when there was something to ask about. Then a band under
            the list — in view, but under the general answers, so the offer
            read as a fallback. Now it leads: the first thing under the field
            says you can chat with AI about the term, and the keyword hits
            follow. A band that never scrolls is visible at every scroll
            position and in the zero-results state alike. */}
        {term && !showAnswer && (
          <div className={s.askBar}>
            <AskRow term={term} onClick={askFromResults} />
          </div>
        )}

        {showAnswer ? (
          /* The answer owns its own scroll region (thread scrolls, input stays),
             so it sits beside `shell.body` rather than inside it. */
          <div className={s.answerBody}>
            <AnswerPanel
              turns={turns}
              onTurnsChange={setTurns}
              onAsk={ask}
              onBackToResults={
                origin === 'results' && term
                  ? () => setView('search')
                  : origin === 'history'
                    ? () => setView('history')
                    : undefined
              }
              backLabel={origin === 'history' ? 'Back to history' : 'Back to results'}
            />
          </div>
        ) : (
          <div className={shell.body}>
            {view === 'history' ? (
              /* The full record. `ChatSubheader` in its history mode is
                 production's own head for this list — glyph, label, Close —
                 and the rows are `ChatHistory`'s 36px `.query`, as buttons.
                 Groups are production's date buckets; see `historyGroup`. */
              <>
                <div className={s.historySubhead}>
                  <ChatSubheader
                    isShowHistory
                    isEmpty
                    isLoggedIn
                    lastQuery=""
                    onToggleHistory={() => setView('search')}
                  />
                </div>
                <div className={ch.root}>
                  {groupedHistory.map(([label, items]) => (
                    <React.Fragment key={label}>
                      <div className={ch.label}>{label}</div>
                      {items.map((thread) => (
                        <button
                          type="button"
                          key={thread.id}
                          className={clsx(ch.query, s.historyRow)}
                          onClick={() => openThread(thread, 'history')}
                        >
                          {thread.turns[0]?.question}
                        </button>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </>
            ) : term && results ? (
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
                    <div className={clsx(rs.root, s.idleSection)}>
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
                  for"), in the overlay's `TryToSearch` row style. It sits
                  above history: the prompts are the offer (what this can do),
                  history is the record (what you did), and the offer ranks
                  first for whoever opens the dialog not knowing either. */}
                <div className={clsx(tt.root, s.idleSection)}>
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

                {/* Past AI Search threads, in production's own words
                    (`ChatSubheader` / `ChatHistory`: "Your AI Search
                    History"). Same row as Recent so the two lists read as one;
                    the glyph is what says a press opens a chat rather than
                    filling the field. Capped at five; the door on the label
                    opens the rest in place. The door is production's own
                    label for exactly this count-and-expand move — the Husky
                    answer's "Show all (N)" over its directory cards — and it
                    only draws when there is something behind it. */}
                {threads.length > 0 && (
                  <>
                    <div className={rs.divider} />
                    <div className={clsx(rs.root, s.idleSection)}>
                      <div className={s.historyHead}>
                        <div className={rs.label}>Your AI Search History</div>
                        {threads.length > HISTORY_ROWS && (
                          <button
                            type="button"
                            className={clsx(sub.button, s.showAll)}
                            onClick={() => setView('history')}
                          >
                            Show all ({threads.length})
                          </button>
                        )}
                      </div>
                      <ul className={rs.list}>
                        {threads.slice(0, HISTORY_ROWS).map((thread) => (
                          <li key={thread.id}>
                            <button
                              type="button"
                              className={clsx(rs.searchItem, s.rowButton)}
                              onClick={() => openThread(thread)}
                            >
                              <Image src="/icons/ai-search.svg" alt="" width={20} height={20} className={s.rowIcon} />
                              <span className={clsx(rs.searchItemText, s.threadTitle)}>
                                {thread.turns[0]?.question}
                              </span>
                              <span className={s.rowWhen}>{whenLabel(thread.createdAt)}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <p className={clsx(shell.hint, s.hintInset)}>
                  Search members, teams, projects, events and forum posts, or chat with AI Search.
                </p>
              </div>
            )}
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
       No section label: the row names itself, and "AI Search" over
       "Chat with AI Search about …" would say it twice. The verb is "chat",
       not "ask": the row opens a thread you can keep talking in, and "ask"
       under-promised that. */
    <div className={clsx(rs.root, s.askRowHost)}>
      <button type="button" className={clsx(rs.searchItem, s.rowButton)} onClick={onClick}>
        <Image src="/icons/ai-search.svg" alt="" width={20} height={20} className={s.rowIcon} />
        <span className={rs.searchItemText}>Chat with AI Search about &ldquo;{term}&rdquo;</span>
        <span className={s.askArrow} aria-hidden="true">
          <ArrowUpRightIcon />
        </span>
      </button>
    </div>
  );
}
