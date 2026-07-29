'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFeedComments } from '@/services/feed/hooks/useFeedComments';
import { useAddFeedComment } from '@/services/feed/hooks/useAddFeedComment';
import { useDeleteFeedComment } from '@/services/feed/hooks/useDeleteFeedComment';
import { FEED_COMMENT_MAX_LENGTH } from '@/services/feed/constants';
import { useTeamNewsAnalytics, type FeedItemKind, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { IFeedComment } from '@/types/feed.types';

import s from './FeedCommentsThread.module.scss';

// Show at most this many comments before capping behind "View all N …".
const VISIBLE = 2;

interface FeedCommentsThreadProps {
  itemUid: string;
  kind: FeedItemKind;
  source: TeamNewsAnalyticsSource;
}

/**
 * Inline feed-only comment thread + composer (ported from the newsfeed-v0
 * prototype's CommentsThread). Feed comments are their own system — posting
 * here never creates or updates a NodeBB forum reply.
 *
 * Mount = expanded: the parent renders this component only while the thread is
 * open, so the lazy comments query fetches on first expand and, with no
 * observer after collapse, never refetches in the background. All comment
 * text / names / roles render via JSX text interpolation only —
 * dangerouslySetInnerHTML is banned in this component.
 *
 * Composer rules (no toasts, ever):
 * - The in-flight comment renders immediately from the mutation's `variables`
 *   (dimmed) — optimistic via UI, nothing written to the cache until the
 *   server confirms, so there's no rollback to get wrong.
 * - The input is cleared ONLY on success; on failure the draft is simply
 *   still there, with an inline error that clears on the next keystroke.
 * - Submit is guarded in the handler (not just the disabled attribute) so
 *   Enter can't double-fire while a submit is in flight.
 *
 * Delete (author-only, `isOwn`): an inline "Delete this comment? Yes / Cancel"
 * swap on the row — no modal, no toast, matching the composer's style. No
 * optimistic removal: the row shows a disabled Yes while the request is in
 * flight, same "nothing touches the cache until the server confirms" rule the
 * composer follows. If the card unmounts mid-confirm (e.g. a mid-session
 * access revocation drops this post from the feed), the pending confirm state
 * is silently discarded — same accepted behavior as an abandoned draft.
 */
export function FeedCommentsThread({ itemUid, kind, source }: FeedCommentsThreadProps) {
  const router = useRouter();
  const analytics = useTeamNewsAnalytics();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [confirmingUid, setConfirmingUid] = useState<string | null>(null);

  const { data } = useFeedComments(itemUid, { enabled: true });
  const addComment = useAddFeedComment(itemUid);
  const deleteComment = useDeleteFeedComment(itemUid);

  const comments: IFeedComment[] = data?.items ?? [];
  // Oldest-first data: the most recent VISIBLE comments are the LAST ones, not
  // the first — a plain slice(0, VISIBLE) would show the oldest instead.
  const shown = expanded ? comments : comments.slice(-VISIBLE);

  const requestDelete = (commentUid: string) => {
    if (deleteComment.isPending) return;
    deleteComment.mutate(
      { commentUid },
      {
        onSuccess: () => setConfirmingUid(null),
      },
    );
  };

  const submit = () => {
    const text = draft.trim();
    if (!text || addComment.isPending) return;
    addComment.mutate(
      { text },
      {
        onSuccess: () => {
          // UI-local follow-ups only — the cache writes live in the hook's
          // options callbacks, which survive this component unmounting.
          setDraft('');
          analytics.onFeedCommentSubmitted(itemUid, kind, source);
        },
      },
    );
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    // A stale "couldn't post" must not sit above a fresh draft.
    if (addComment.isError) addComment.reset();
  };

  const goToLogin = () => {
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  };

  const pendingText = addComment.isPending ? addComment.variables?.text.trim() : undefined;

  return (
    <div className={s.thread} onClick={(e) => e.stopPropagation()}>
      {/* Composer sits above the list — leave a comment first, then read. */}
      {isHydrated && !currentUser ? (
        <div className={s.signedOut}>
          <span>Join the conversation —</span>
          <button type="button" className={s.signInBtn} onClick={goToLogin}>
            sign in to comment
          </button>
        </div>
      ) : (
        <div className={s.composer}>
          <form
            className={s.inline}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              className={s.forumField}
              value={draft}
              maxLength={FEED_COMMENT_MAX_LENGTH}
              placeholder="Write your comment here…"
              onChange={(e) => handleDraftChange(e.target.value)}
            />
            <button
              type="submit"
              className={clsx(
                s.primaryBtn,
                s.commentBtn,
                (!draft.trim() || addComment.isPending) && s.commentBtnDisabled,
              )}
              disabled={!draft.trim() || addComment.isPending}
            >
              Comment
            </button>
          </form>
          {addComment.isError && (
            <p className={s.error} role="alert">
              Couldn&apos;t post your comment — try again.
            </p>
          )}
        </div>
      )}

      {(comments.length > 0 || pendingText) && (
        <div className={s.list}>
          {pendingText && (
            <div className={clsx(s.item, s.itemPending)}>
              <img
                className={s.avatar}
                src={currentUser?.profileImageUrl || getDefaultAvatar(currentUser?.name ?? 'You')}
                alt=""
                loading="lazy"
              />
              <div className={s.body}>
                <div className={s.head}>
                  <span className={s.name}>{currentUser?.name ?? 'You'}</span>
                  <span className={s.time}>· posting…</span>
                </div>
                <p className={s.text}>{pendingText}</p>
              </div>
            </div>
          )}
          {shown.map((c) => {
            const isConfirming = confirmingUid === c.uid;
            const isDeletingThis = deleteComment.isPending && deleteComment.variables?.commentUid === c.uid;
            const deleteFailedThis = deleteComment.isError && deleteComment.variables?.commentUid === c.uid;
            return (
              <div key={c.uid} className={s.item}>
                <img
                  className={s.avatar}
                  src={c.author.avatarUrl || getDefaultAvatar(c.author.name)}
                  alt=""
                  loading="lazy"
                />
                <div className={s.body}>
                  <div className={s.head}>
                    <span className={s.name}>{c.author.name}</span>
                    {c.author.role && <span className={s.role}>· {c.author.role}</span>}
                    <span className={s.time}>· {formatTimeAgo(c.createdAt)}</span>
                    {c.isOwn &&
                      (isConfirming ? (
                        <span className={s.deleteConfirm}>
                          Delete this comment?
                          <button
                            type="button"
                            className={s.deleteConfirmBtn}
                            disabled={isDeletingThis}
                            onClick={() => requestDelete(c.uid)}
                          >
                            {isDeletingThis ? 'Deleting…' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            className={s.deleteCancelBtn}
                            disabled={isDeletingThis}
                            onClick={() => {
                              setConfirmingUid(null);
                              if (deleteComment.isError) deleteComment.reset();
                            }}
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button type="button" className={s.deleteBtn} onClick={() => setConfirmingUid(c.uid)}>
                          Delete
                        </button>
                      ))}
                  </div>
                  <p className={s.text}>{c.text}</p>
                  {deleteFailedThis && (
                    <p className={s.error} role="alert">
                      Couldn&apos;t delete — try again.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {comments.length > VISIBLE && (
            <button type="button" className={s.viewAll} onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Show fewer comments' : `View all ${comments.length} comments`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
