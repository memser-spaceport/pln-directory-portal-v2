'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { format, getYear, isToday, isYesterday, subDays, subMonths, subWeeks } from 'date-fns';

import { Modal } from '@/components/common/Modal';
// Production's own history chrome: the subheader that toggles the list in the
// AI column (clock glyph, "Your AI Search History", Close) — import-safe, no
// hooks — and the list's stylesheet (date-group label, 36px row).
import { ChatSubheader } from '@/components/core/application-search/components/AiChatPanel/components/ChatSubheader/ChatSubheader';
import ch from '@/components/core/application-search/components/AiChatPanel/components/ChatHistory/ChatHistory.module.scss';
import sub from '@/components/core/application-search/components/AiChatPanel/components/ChatSubheader/ChatSubheader.module.scss';
import { CloseIcon } from '@/components/icons';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';

// Production stylesheets, imported so the rows sit in production's list.
import shell from '../nav-shared/PrototypeSearchModal.module.scss';
import rs from '@/components/core/application-search/components/RecentSearch/RecentSearch.module.scss';
import tt from '@/components/core/application-search/components/TryToSearch/TryToSearch.module.scss';

import { AnswerPanel, makeTurn, type Turn } from './AnswerPanel';
import { SearchField } from './SearchField';
import sf from './SearchField.module.scss';
import { CHAT_HISTORY_SEED, FOUNDER_PROMPTS, SUGGESTED_PROMPTS } from './mocks';
import { useAiSearchViewer } from './viewer';
import { QuerySuggestions } from './QuerySuggestions';
import { suggestQuestions } from './suggestions';
import type { AiSearchScope } from './scope';
import s from './AiSearchView.module.scss';

const INPUT_ID = 'ai-search-input';

/** Where the view was opened from, which is where its Back goes. */
export type AiOrigin = 'results' | null;

export interface AiSearchRequest {
  /** Asked the moment the view opens. Empty: the view opens on its idle state. */
  question: string;
  origin: AiOrigin;
  /** Changes per open, so the same question can be asked twice. */
  nonce: number;
}

interface AiSearchViewProps {
  open: boolean;
  onClose: () => void;
  /** What to do on open: a question from the popover's row, or nothing. */
  request?: AiSearchRequest | null;
  /** Reopens the keyword popover with its term intact. Present when `request.origin` was `results`. */
  onBackToResults?: () => void;
  /**
   * Opens the view already narrowed to one entity, as a chip in the field.
   * The team profile passes its team; the header search passes nothing.
   */
  scope?: AiSearchScope | null;
}

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
 * AI Search as a **full-screen view** — the answer surface, on its own.
 *
 * This was one dialog with keyword search: the AI row led the results and the
 * answer was a state of the same card. "Make it almost full page" came in while
 * the answer was in it, and the size was earned by the answer — a streamed
 * reply, cards, follow-ups, a thread — while the keyword list got dragged along.
 * The keyword half is a lookup and now has a popover the size of a lookup
 * (`SearchPopover`); this keeps the takeover, and holds only what needs it.
 *
 * Three states, one card:
 *  - **idle** — the field, then "Try asking or searching for" (the Husky
 *    page's own prompt block, with prompts phrased as directory finds, or the
 *    scope's own questions), then **Your AI Search History** (production's
 *    own label and row lineage, from `ChatHistory`, as one section of the list
 *    rather than behind a toggle in an AI column), then the scope hint. Enter
 *    in the field or a prompt starts a thread; a history row reopens one.
 *  - **history** — the whole record, in production's `ChatSubheader` +
 *    `ChatHistory` grammar, grouped by production's date buckets.
 *  - **answer** — `AnswerPanel`. The field row becomes a title bar (the chip,
 *    the thread's first question, ✕): the thread's own input at the bottom is
 *    the one place to type, and a second field above it asking "new question?"
 *    is the two-inputs surface this prototype exists to replace. New question
 *    is a press in the answer's bar; it returns here.
 *
 * Opened from the popover's row, the term arrives as the first question and
 * Back returns to the popover with the term still in it — the seam that makes
 * two surfaces read as one. Opened from a team profile, the team arrives as
 * the scope chip; removing it widens this visit to the network.
 *
 * Threads are the source of truth for the answer state: the open thread's
 * turns are what `AnswerPanel` edits, so closing the view keeps the chat as
 * the newest row under history, and a thread closed mid-stream picks the
 * stream back up when reopened. The feature is named "AI Search" everywhere a
 * person reads it (production's own label); "Husky" stays a component name.
 * "Continue in AI Search" is gone: that link led to a bigger page when this
 * was a small dialog, and this is the bigger page now.
 */
export function AiSearchView({ open, onClose, request, onBackToResults, scope = null }: AiSearchViewProps) {
  const viewer = useAiSearchViewer();
  const [question, setQuestion] = useState('');
  const [view, setView] = useState<'idle' | 'answer' | 'history'>('idle');
  const [threads, setThreads] = useState<ChatThread[]>(seedThreads);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  /** Which list the answer was reached from, so Back has somewhere to go — and a name. */
  const [origin, setOrigin] = useState<AiOrigin | 'history'>(null);

  /**
   * The scope in force. Seeded from the opener every time the view opens;
   * removing the chip widens this visit to the network and nothing else.
   */
  const [activeScope, setActiveScope] = useState<AiSearchScope | null>(scope);
  useEffect(() => {
    if (open) setActiveScope(scope);
  }, [open, scope]);

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

  const groupedHistory = useMemo(() => groupHistory(threads), [threads]);

  /* A new thread, newest first in history, asked inside the scope in force. */
  const startThread = useCallback(
    (q: string, from?: AiOrigin | 'history', inScope: AiSearchScope | null = activeScope) => {
      const text = q.trim();
      if (!text) return;
      const thread: ChatThread = {
        id: nextThreadId++,
        createdAt: new Date(),
        turns: [makeTurn(text, inScope, viewer)],
      };
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(thread.id);
      /* A visit that came from the popover keeps its way back through every
         thread it starts; only a thread opened from history changes that. */
      setOrigin(from ?? (origin === 'results' ? 'results' : null));
      setView('answer');
      setQuestion('');
    },
    [activeScope, origin, viewer],
  );

  /* What the opener asked for, once per open: the popover's term as the first
     question, or nothing. The scope arriving with the same open is the
     opener's, not whatever the last visit left. */
  useEffect(() => {
    if (!open) return;
    if (request?.question) startThread(request.question, request.origin, scope);
    else {
      /* Opened idle from a result row: the chip is in, and Back still leads
         to the results the row was on. */
      setOrigin(request?.origin ?? null);
      const raf = requestAnimationFrame(() => document.getElementById(INPUT_ID)?.focus());
      return () => cancelAnimationFrame(raf);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request?.nonce]);

  /**
   * Unsent follow-ups, kept per thread. A half-written question is work, and
   * the only thing on this surface that closing could destroy — the answers
   * are in the thread, the thread is in history, and the thread you left is
   * the row you reopen. Per thread, not one draft for the view: a question
   * begun in one chat has no business appearing in another.
   */
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const setDraft = useCallback(
    (text: string) => {
      if (activeThreadId == null) return;
      setDrafts((prev) => ({ ...prev, [activeThreadId]: text }));
    },
    [activeThreadId],
  );

  /* Close leaves the threads alone: the chat you were in is the first history
     row next time, with whatever you had started typing in it. The field's
     own unsent question keeps likewise — only the view's position resets. */
  const reset = () => {
    setView('idle');
    setActiveThreadId(null);
    setOrigin(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const removeScope = () => {
    setActiveScope(null);
    requestAnimationFrame(() => document.getElementById(INPUT_ID)?.focus());
  };

  /* A follow-up in the open thread. */
  const ask = useCallback(
    (q: string) => {
      setTurns((prev) => [...prev, makeTurn(q, activeScope, viewer)]);
      setView('answer');
    },
    [setTurns, activeScope],
  );

  /* From the idle rows there is nothing to go back to but the idle state
     itself; from the full list, Back returns to the list. */
  const openThread = (thread: ChatThread, from: 'history' | null = null) => {
    setOrigin(from);
    setActiveThreadId(thread.id);
    setView('answer');
  };

  /* An answer's door hands over to the page that opened the view. The
     opener's scope resolves it even if the chip was removed since. */
  const openTarget = scope
    ? (target: string) => {
        handleClose();
        scope.onOpen(target);
      }
    : undefined;

  const showAnswer = view === 'answer' && turns.length > 0;

  /* Suggestions follow the typing, so they read the keystrokes (`live`) rather
     than `question`, which production's debounce delivers 700ms late. Scoped,
     only the scope's own questions are on offer. ↓/↑ walk the list and Enter
     asks the row they are on; with no row chosen Enter asks what was typed,
     as before. */
  const [live, setLive] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const suggestions = useMemo(
    () => (view === 'idle' ? suggestQuestions(live, { viewer, pool: activeScope?.prompts }) : []),
    [view, live, viewer, activeScope],
  );
  useEffect(() => setActiveSuggestion(-1), [live]);
  const pickSuggestion = (text: string) => {
    setLive('');
    startThread(text);
  };
  /* A founder's first prompt is the question only their seat gets a fuller
     answer to — the offer leads, as the prompts lead history. */
  const prompts =
    activeScope?.prompts ?? (viewer === 'founder' ? [...FOUNDER_PROMPTS, ...SUGGESTED_PROMPTS] : SUGGESTED_PROMPTS);

  return (
    <Modal isOpen={open} onClose={handleClose} overlayClassname={shell.overlay} className={shell.container} lockScroll>
      <div className={shell.card} role="dialog" aria-modal="true" aria-label="AI Search">
        {showAnswer ? (
          /* The title bar: same row, same chip, same ✕ — the input gives way
             to the thread's name, since the thread's own input is below. */
          <div className={clsx(sf.headerBar, s.titleBar)}>
            <AiSearchIcon className={s.titleIcon} />
            {activeScope && (
              <span className={clsx(sf.scopeChip, s.titleChip)}>
                <img
                  className={clsx(sf.scopeLogo, activeScope.kind === 'member' && sf.scopeLogoPerson)}
                  src={activeScope.logo}
                  alt=""
                  width={16}
                  height={16}
                />
                <span className={sf.scopeName}>About {activeScope.name}</span>
              </span>
            )}
            <span className={s.title} title={turns[0]?.question}>
              {turns[0]?.question}
            </span>
            <button type="button" className={sf.close} onClick={handleClose} aria-label="Close AI Search">
              <CloseIcon />
            </button>
          </div>
        ) : (
          <SearchField
            id={INPUT_ID}
            value={question}
            onChange={(next) => {
              setQuestion(next);
              setLive(next); // Clear lands here without a keystroke
            }}
            onLiveChange={setLive}
            onSubmit={(q) => {
              setLive('');
              startThread(q);
            }}
            /* -1 is the field itself: ↓ past the last row and ↑ past the first
               both come back to what was typed, as every suggestion list does. */
            onArrow={(dir) =>
              setActiveSuggestion((i) => {
                const next = i + dir;
                if (!suggestions.length || next >= suggestions.length) return -1;
                return next < -1 ? suggestions.length - 1 : next;
              })
            }
            onEnter={() => {
              const chosen = suggestions[activeSuggestion];
              if (!chosen) return false;
              pickSuggestion(chosen.text);
              return true;
            }}
            activeDescendant={activeSuggestion >= 0 ? `ai-suggestion-${activeSuggestion}` : undefined}
            /* One job now, so the placeholder names it. Scoped, the chip
               already names the team. */
            placeholder={activeScope ? `Ask about ${activeScope.name}` : 'Ask AI Search a question'}
            scope={activeScope}
            onRemoveScope={removeScope}
            /* The AI mark, not the popover's magnifier: the two fields are
               one chrome, and the glyph is what tells them apart. */
            glyph={<AiSearchIcon />}
            onClose={handleClose}
            closeLabel="Close AI Search"
          />
        )}

        {showAnswer ? (
          /* The answer owns its own scroll region (thread scrolls, input stays),
             so it sits beside `shell.body` rather than inside it. */
          <div className={s.answerBody}>
            <AnswerPanel
              turns={turns}
              onTurnsChange={setTurns}
              onAsk={ask}
              draft={activeThreadId == null ? '' : (drafts[activeThreadId] ?? '')}
              onDraftChange={setDraft}
              onBackToResults={
                origin === 'results' && onBackToResults
                  ? () => {
                      reset();
                      onBackToResults();
                    }
                  : origin === 'history'
                    ? () => setView('history')
                    : undefined
              }
              backLabel={origin === 'history' ? 'Back to history' : 'Back to results'}
              onNewQuestion={() => {
                setView('idle');
                setActiveThreadId(null);
                requestAnimationFrame(() => document.getElementById(INPUT_ID)?.focus());
              }}
              onOpenTarget={openTarget}
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
                    onToggleHistory={() => setView('idle')}
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
            ) : (
              <div className={shell.idle}>
                {/* The Husky page's own prompt block ("Try asking or searching
                    for"), in the overlay's `TryToSearch` row style. It sits
                    above history: the prompts are the offer (what this can
                    do), history is the record (what you did), and the offer
                    ranks first for whoever opens the view not knowing either.
                    Scoped, the prompts are the reader's own questions, one per
                    section the page has (ClickUp and Deel seed with the
                    user's records, not with capabilities). */}
                {/* While you type, the same slot holds the questions that match
                    it, in the same rows: a suggestion is a prompt that fits
                    what is in the field. No match, and the prompts stay. */}
                {suggestions.length > 0 ? (
                  <div className={clsx(tt.root, s.idleSection)}>
                    <div className={tt.label}>Suggestions</div>
                    <QuerySuggestions
                      suggestions={suggestions}
                      query={live}
                      onPick={pickSuggestion}
                      variant="prompts"
                      activeIndex={activeSuggestion}
                      idPrefix="ai-suggestion"
                    />
                  </div>
                ) : (
                  <div className={clsx(tt.root, s.idleSection)}>
                    <div className={tt.label}>Try asking</div>
                    <ul className={tt.list}>
                      {prompts.map((p) => (
                        <li key={p.text}>
                          <button
                            type="button"
                            className={clsx(tt.suggestionButton, s.promptButton)}
                            onClick={() => startThread(p.text)}
                          >
                            <img src={p.icon} alt="" className={s.promptIcon} />
                            {p.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Past AI Search threads, in production's own words
                    (`ChatSubheader` / `ChatHistory`: "Your AI Search
                    History"). Capped at five; the door on the label opens the
                    rest in place, wearing the Husky answer's own "Show all (N)"
                    for exactly this count-and-expand move. */}
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
                              <AiSearchIcon className={s.rowIcon} />
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

                {/* The one thing the chip can't show: what its ✕ widens to. */}
                <p className={clsx(shell.hint, s.hintInset)}>
                  {activeScope
                    ? `Answers come from the ${activeScope.name} profile. Remove it from the field to ask the whole network.`
                    : 'Answers come from the directory: members, teams, projects, events and forum posts.'}
                </p>
              </div>
            )}
          </div>
        )}

        <div className={s.footer}>
          <span className={s.footerItem}>
            <kbd className={s.kbd}>Esc</kbd> to close
          </span>
        </div>
      </div>
    </Modal>
  );
}
