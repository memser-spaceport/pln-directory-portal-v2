'use client';

import { clsx } from 'clsx';
import { useState } from 'react';

import { CloseIcon } from '@/components/icons';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';
import {
  ALL_FEEDBACK_STATUSES,
  FEEDBACK_STATUS_FILTER_OPTIONS,
} from '@/components/page/ai-apps/AiAppFeedbackPage/constants';
import { AI_APP_FEEDBACK_STATUS_LABELS } from '@/services/ai-app-feedback/constants';
// Forum comment rows (avatar, name, time) and the feedback table's status pill,
// so a row here reads like the same person and the same status everywhere.
import ci from '@/components/page/forum/PostComments/components/CommentItem/CommentItem.module.scss';
import st from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackStatusSelector/FeedbackStatusSelector.module.scss';

import { formatMinutesAgo } from '../../feedback-shared/comments/time';
import type { Thread } from './useThreads';
import s from './CommentsPanel.module.scss';

interface Props {
  threads: Thread[];
  canManage: boolean;
  openId: string | null;
  /** False when a pinned thread's element is no longer in the deployed app. */
  isOnPage: (t: Thread) => boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onClose: () => void;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Every thread on this app, newest first, beside the app — Framer's and Air's
 * comments column, open for as long as comment mode is. It is where threads are
 * *read*; writing happens on the app, where you click, so the panel has no
 * composer of its own.
 *
 * The filter is production's: the feedback page's All / New / Reviewed / Shipped
 * (`FEEDBACK_STATUS_FILTER_OPTIONS`) in the same `SortDropdown`. A thread is a
 * feedback row, so it carries the triage the author already does, rather than a
 * second Open / Resolved vocabulary on top of it.
 *
 * Each row names what it is about — the element's words, or, when a
 * redeploy took the element away, the old words under "Not on the current
 * version". That last line is why the label is stored at pick time.
 */
export function CommentsPanel({ threads, canManage, openId, isOnPage, onSelect, onHover, onClose }: Props) {
  const [status, setStatus] = useState<string>(ALL_FEEDBACK_STATUSES);
  const rows = status === ALL_FEEDBACK_STATUSES ? threads : threads.filter((t) => t.status === status);

  return (
    <aside className={s.panel} aria-label="Comments">
      <div className={s.head}>
        <h2 className={s.title}>
          Comments <span className={s.count}>{threads.length}</span>
        </h2>
        <div className={s.headActions}>
          <SortDropdown options={FEEDBACK_STATUS_FILTER_OPTIONS} currentSort={status} onSortChange={setStatus} />
          <button type="button" className={s.close} onClick={onClose} aria-label="Close comments">
            <CloseIcon width={16} height={16} />
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className={s.empty}>
          {threads.length > 0
            ? 'Nothing with this status.'
            : 'No comments yet. Click anywhere on the app to start one.'}
        </p>
      ) : (
        <ul className={s.list}>
          {rows.map((t) => {
            const detached = !isOnPage(t);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  className={clsx(s.row, t.id === openId && s.rowOpen)}
                  onClick={() => onSelect(t.id)}
                  onMouseEnter={() => onHover(t.id)}
                  onMouseLeave={() => onHover(null)}
                  onFocus={() => onHover(t.id)}
                  onBlur={() => onHover(null)}
                >
                  <span className={s.rowHead}>
                    <span className={ci.Avatar} style={{ backgroundColor: getAvatarColor(t.authorName) }} aria-hidden>
                      <span className={ci.Fallback}>{initials(t.authorName)}</span>
                    </span>
                    <span className={s.who}>
                      <span className={s.name}>{t.authorName}</span>
                      <span className={s.time}>{formatMinutesAgo(t.minutesAgo)}</span>
                    </span>
                    {/* New is the author's triage word; a visitor sees a status once it says something. */}
                    {(canManage || t.status !== 'NEW') && (
                      <span className={clsx(st.badge, st[`badge_${t.status}`], s.badge)}>
                        {AI_APP_FEEDBACK_STATUS_LABELS[t.status]}
                      </span>
                    )}
                  </span>

                  <span className={clsx(s.about, detached && s.aboutGone)}>
                    {detached ? (
                      <>
                        <span className={s.goneNote}>Not on the current version</span>
                        <span className={s.goneLabel}>{t.label}</span>
                      </>
                    ) : (
                      <>
                        <PinGlyph />
                        <span className={s.aboutLabel}>{t.label}</span>
                      </>
                    )}
                  </span>

                  <span className={s.text}>{t.text}</span>

                  {t.replies.length > 0 && (
                    <span className={s.replies}>
                      {t.replies.length} {t.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

/* The pin's own teardrop at text size, so "about this element" reads as the pin on the app. */
function PinGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className={s.pinGlyph}>
      <path
        d="M6 1.25a3.75 3.75 0 0 1 3.75 3.75c0 2.5-3.75 5.75-3.75 5.75S2.25 7.5 2.25 5A3.75 3.75 0 0 1 6 1.25Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="5" r="1.25" fill="currentColor" />
    </svg>
  );
}
