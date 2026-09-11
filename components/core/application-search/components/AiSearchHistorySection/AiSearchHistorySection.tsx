'use client';

import React, { useMemo, useState } from 'react';
import { format, getYear, isToday, isYesterday, subMonths, subWeeks } from 'date-fns';

import { useChatHistory, type ChatHistoryThread } from '@/services/search/hooks/useChatHistory';
import { ChatSubheader } from '@/components/core/application-search/components/AiChatPanel/components/ChatSubheader';

import s from './AiSearchHistorySection.module.scss';

/** How many threads the idle state lists before "Show all". */
const COMPACT_ROWS = 5;

const FIXED_GROUPS = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days'];

/**
 * Which bucket a thread belongs to.
 *
 * The two implementations this replaces both filed a thread older than 30 days
 * under its year *only when that year was a past one* — so a conversation from
 * two months ago, in the current year, matched no bucket and was never drawn at
 * all. It gets the current year's label here, which is what those functions
 * would have given it in January.
 */
function groupFor(date: Date, now: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (date > subWeeks(now, 1)) return 'Last 7 days';
  if (date > subMonths(now, 1)) return 'Last 30 days';
  return String(getYear(date));
}

/** The date marker a compact row carries on its right. */
function whenLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

function groupThreads(threads: ChatHistoryThread[]): Array<[string, ChatHistoryThread[]]> {
  const now = new Date();
  const groups = new Map<string, ChatHistoryThread[]>();

  for (const thread of threads) {
    const date = new Date(thread.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = groupFor(date, now);
    groups.set(key, [...(groups.get(key) ?? []), thread]);
  }

  const years = [...groups.keys()].filter((key) => !FIXED_GROUPS.includes(key)).sort((a, b) => Number(b) - Number(a));

  return [...FIXED_GROUPS, ...years]
    .filter((key) => groups.has(key))
    .map((key) => [key, groups.get(key)!] as [string, ChatHistoryThread[]]);
}

interface Props {
  mode: 'compact' | 'full';
  isLoggedIn: boolean;
  /** Resolves false when the thread could not be loaded. */
  onOpenThread: (threadId: string) => Promise<boolean>;
  onShowAll: () => void;
  onCloseFull: () => void;
}

/**
 * Your AI Search History — five rows in the idle state, the whole record behind
 * "Show all (N)", both from one module because they are one list.
 *
 * A row reopens the thread *in the dialog*. The version this replaces pushed
 * `/husky/chat/[id]`, which cost the person the search they were in the middle
 * of to reach a conversation they could have read where they stood.
 */
export const AiSearchHistorySection = ({ mode, isLoggedIn, onOpenThread, onShowAll, onCloseFull }: Props) => {
  const { data, isLoading, isError, refetch } = useChatHistory({ enabled: isLoggedIn });
  const [failedThreadId, setFailedThreadId] = useState<string | null>(null);

  /* `Array.isArray` rather than `?? []`: this list has already been bitten once
     by a non-array arriving where a list was expected, and spreading an object
     throws rather than degrading. */
  const threads = useMemo(
    () =>
      (Array.isArray(data) ? [...data] : []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data],
  );
  const grouped = useMemo(() => (mode === 'full' ? groupThreads(threads) : []), [mode, threads]);

  const open = async (threadId: string) => {
    setFailedThreadId(null);
    const ok = await onOpenThread(threadId);
    if (!ok) setFailedThreadId(threadId);
  };

  if (!isLoggedIn) {
    if (mode === 'full') return null;
    return (
      <div className={s.section}>
        <div className={s.label}>Your AI Search History</div>
        <p className={s.signedOut}>Sign in to keep your AI Search history.</p>
      </div>
    );
  }

  if (mode === 'full') {
    return (
      <>
        <div className={s.subhead}>
          <ChatSubheader isShowHistory isEmpty isLoggedIn lastQuery="" onToggleHistory={onCloseFull} />
        </div>
        <div className={s.fullList}>
          {grouped.map(([label, items]) => (
            <React.Fragment key={label}>
              <div className={s.groupLabel}>{label}</div>
              {items.map((thread) => (
                <React.Fragment key={thread.threadId}>
                  <button type="button" className={s.row} onClick={() => open(thread.threadId)}>
                    <span className={s.title}>{thread.title}</span>
                  </button>
                  {failedThreadId === thread.threadId && <FailedRow onRetry={() => open(thread.threadId)} />}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
      </>
    );
  }

  // Compact — the idle state's section.
  if (isLoading) {
    return (
      <div className={s.section}>
        <div className={s.label}>Your AI Search History</div>
        <div className={s.skeleton} aria-hidden />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={s.section}>
        <div className={s.label}>Your AI Search History</div>
        <p className={s.failed}>
          Couldn&rsquo;t load your history.{' '}
          <button type="button" className={s.retry} onClick={() => refetch()}>
            Try again
          </button>
        </p>
      </div>
    );
  }

  // Nothing to show is not a section. Saying "you have no history" to someone
  // who has never used the feature explains a thing they did not ask about.
  if (!threads.length) return null;

  const compact = threads.slice(0, COMPACT_ROWS);

  return (
    <div className={s.section}>
      <div className={s.head}>
        <div className={s.label}>Your AI Search History</div>
        {threads.length > COMPACT_ROWS && (
          <button type="button" className={s.showAll} onClick={onShowAll}>
            Show all ({threads.length})
          </button>
        )}
      </div>
      <ul className={s.list}>
        {compact.map((thread) => (
          <li key={thread.threadId}>
            <button type="button" className={s.row} onClick={() => open(thread.threadId)}>
              <span className={s.title}>{thread.title}</span>
              <span className={s.when}>{whenLabel(new Date(thread.createdAt))}</span>
            </button>
            {failedThreadId === thread.threadId && <FailedRow onRetry={() => open(thread.threadId)} />}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* A thread that would not load leaves the person in the list, with a way to try
   again. The old code fired an analytics event off the error object and then
   dropped them into an empty answer with no explanation. */
const FailedRow = ({ onRetry }: { onRetry: () => void }) => (
  <p className={s.failed}>
    Couldn&rsquo;t open that conversation.{' '}
    <button type="button" className={s.retry} onClick={onRetry}>
      Try again
    </button>
  </p>
);
