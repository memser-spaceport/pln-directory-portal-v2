'use client';

import React from 'react';
import clsx from 'clsx';

// Production's history list chrome: `ChatHistory`'s 12px date-group label.
import ch from '@/components/core/application-search/components/AiChatPanel/components/ChatHistory/ChatHistory.module.scss';
import sub from '@/components/core/application-search/components/AiChatPanel/components/ChatSubheader/ChatSubheader.module.scss';

import { groupHistory, threadTitle, type ChatThread } from './threads';
import { TrashGlyph } from './icons';
import s from './AiMode.module.scss';

interface HistoryListProps {
  threads: ChatThread[];
  activeId: number | null;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  /**
   * The modal alternative: the rail lists this many, newest first and
   * ungrouped, with "Show all history (N)" under them. The page lists every
   * thread, grouped, because holding the history is the page's job.
   */
  limit?: number;
  onShowAll?: () => void;
}

/**
 * Past AI Search chats, grouped by production's date buckets (Today /
 * Yesterday / Last 7 days / Last 30 days / year — `app-sidebar.tsx`).
 *
 * Rows transcribe production's `ThreadItem` (14/22, 4px 8px, 4px radius,
 * wash on hover and on the open thread, delete appearing on hover and on the
 * open row). Colour translated to token pairs: production's `#64748b` row text
 * becomes secondary, its `#f1f5f9` hover the dark-4 wash and the open row
 * dark-6, one step up so "you are here" outranks "you are pointing at".
 * The open row's title also goes primary — the one addition, because on a
 * page with the thread beside it the rail is how you tell which chat this is.
 * Delete keeps production's confirm (the product's `ConfirmDialog`), and the
 * row is two buttons side by side rather than a clickable `<li>` holding one.
 */
export function HistoryList({ threads, activeId, onOpen, onDelete, limit, onShowAll }: HistoryListProps) {
  if (threads.length === 0) {
    /* Production's own empty line, as it reads in the Husky sidebar. */
    return <p className={s.historyEmpty}>Your conversations will appear here once you start chatting!</p>;
  }

  const row = (thread: ChatThread) => (
    <li key={thread.id} className={clsx(s.threadRow, thread.id === activeId && s.threadRowActive)}>
      <button
        type="button"
        className={s.threadOpen}
        onClick={() => onOpen(thread.id)}
        aria-current={thread.id === activeId ? 'page' : undefined}
        title={threadTitle(thread)}
      >
        {threadTitle(thread)}
      </button>
      <button
        type="button"
        className={s.threadDelete}
        onClick={() => onDelete(thread.id)}
        aria-label={`Delete “${threadTitle(thread)}”`}
      >
        <TrashGlyph />
      </button>
    </li>
  );

  if (limit != null) {
    return (
      <div className={s.historyGroups}>
        <ul className={s.threadList}>{threads.slice(0, limit).map(row)}</ul>
        {threads.length > limit && onShowAll && (
          <button type="button" className={clsx(sub.button, s.showAllHistory)} onClick={onShowAll}>
            Show all history ({threads.length})
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={s.historyGroups}>
      {groupHistory(threads).map(([label, items]) => (
        <div key={label} className={s.historyGroup}>
          <div className={clsx(ch.label, s.groupLabel)}>{label}</div>
          <ul className={s.threadList}>{items.map(row)}</ul>
        </div>
      ))}
    </div>
  );
}
