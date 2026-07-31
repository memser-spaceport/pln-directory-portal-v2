'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { clampDepth } from '@/utils/comments';
import { isBlankHtml } from '@/utils/html';
import { useCurrentUserStore } from '@/services/auth/store';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';
import { forumErrorMessage } from '@/services/forum/forum.service';
import { useFeedComments } from '@/services/feed/hooks/useFeedComments';
import { useAddFeedComment } from '@/services/feed/hooks/useAddFeedComment';
import { useDeleteFeedComment } from '@/services/feed/hooks/useDeleteFeedComment';
import { FEED_COMMENT_MAX_LENGTH } from '@/services/feed/constants';
import { useTeamNewsAnalytics, type FeedItemKind, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import { isForumPostUid, type IFeedComment } from '@/types/feed.types';

import { FeedCommentContent, hasRenderableContent } from './FeedCommentContent';

import s from './FeedCommentsThread.module.scss';

// Quill is ~100kB of editor for a one-line comment box, and most /home visits
// never open a composer. ssr:false because it needs the DOM.
// Imported by path, not through the barrel: `index.ts` is `export *`, which
// does not re-export the default, so dynamic() would resolve to no component.
const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor/RichTextEditor'), {
  ssr: false,
  loading: () => <div className={s.composerLoading} />,
});

// Show at most this many TOP-LEVEL comments before capping behind "View all N …".
const VISIBLE = 2;

// Deepest rendered level, as a depth index — 2 means comment → reply →
// reply-to-reply, the same cap as the forum's CommentItem.MAX_DEPTH. The wire
// allows unlimited depth, so anything deeper is lifted to this level by
// clampDepth rather than indented off the edge of the modal.
const MAX_DEPTH = 2;

const POST_FAILED = 'Couldn’t post your comment — try again.';
// A mention costs ~150 characters of markup behind a short name, so this can
// fire on a comment that looks well within the limit. Name the likely cause.
const TOO_LONG = 'That’s too long to post — try shortening it, or removing a mention.';

/** Total comments in the thread, replies included — matches what the count
 *  badge shows (the backend counts every row under an item, at any depth). */
function countComments(comments: readonly IFeedComment[]): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
}

/** How many members this comment mentions — the class MentionBlot stamps is
 *  the only marker distinguishing a mention from an ordinary link. */
function countMentions(html: string): number {
  return html.match(/class="ql-mention"/g)?.length ?? 0;
}

/** Is `uid` this comment or anywhere in its subtree? */
function containsUid(comment: IFeedComment, uid: string): boolean {
  return comment.uid === uid || comment.replies.some((reply) => containsUid(reply, uid));
}

/**
 * The last `count` top-level comments, plus any whose subtree the member is
 * currently working in.
 *
 * A bare `slice(-count)` is a sliding window over a list that GROWS AT THE END
 * (insertCommentIntoTree appends), so posting a comment silently unmounts the
 * row above it — taking an open reply composer, its unsent draft, and any
 * in-flight reply's pending row with it. Pinning costs one pass and makes the
 * window stable exactly where it has to be.
 */
function windowWithPinned(
  comments: readonly IFeedComment[],
  count: number,
  activeUids: readonly string[],
): readonly IFeedComment[] {
  if (comments.length <= count) return comments;
  const tail = new Set(comments.slice(-count).map((comment) => comment.uid));
  if (activeUids.length === 0) return comments.slice(-count);
  return comments.filter((comment) => tail.has(comment.uid) || activeUids.some((uid) => containsUid(comment, uid)));
}

/** Stable DOM id for a thread region, so a card's badge can own `aria-controls`
 *  without either component having to thread a generated id between them. */
export function feedThreadDomId(itemUid: string): string {
  return `feed-thread-${itemUid}`;
}

interface FeedCommentsThreadProps {
  itemUid: string;
  kind: FeedItemKind;
  source: TeamNewsAnalyticsSource;
  /** Forum posts only: the topic's opening post, which a top-level comment
   *  replies to. Lets the write happen in one request instead of two. */
  forumMainPid?: number;
  /** CARD SURFACES ONLY, and the single switch between the two layouts: its
   *  presence caps the list at VISIBLE and turns the overflow affordance into
   *  "open the detail modal". The modal omits it and renders the whole thread —
   *  without that asymmetry the escalation would land on a modal showing the
   *  same two comments behind the same button. */
  onViewAll?: () => void;
  /** Card surfaces only: bounce to #login recording which item's thread was
   *  open, so the round trip lands back on it. Defaults to a bare #login push,
   *  which from a card loses that context entirely. */
  onSignIn?: () => void;
  /** Card surfaces only: "there is an unsettled write in here". Closing a modal
   *  is a deliberate "I'm done"; clicking a disclosure badge is not, and the
   *  mutation's error state — unlike its cache writes — does not survive
   *  unmount, so a collapse mid-flight can drop a failed comment in silence. */
  onBusyChange?: (busy: boolean) => void;
}

/**
 * Comment thread + composer for a feed item, rendered inside the detail modal.
 *
 * The comments come from one of two entirely separate systems, and this
 * component is deliberately blind to which: news comments are directory-native,
 * a forum post's comments are its real NodeBB topic replies — posting one here
 * really does appear on /forum. Both arrive as the same `IFeedComment` tree from
 * services/feed/feed.service.ts.
 *
 * Mount = expanded: the parent renders this component only while the thread is
 * open, so the lazy comments query fetches on mount and, with no observer after
 * close, never refetches in the background.
 *
 * Comment BODIES are HTML — they carry links and `ql-mention` anchors — and go
 * through FeedCommentContent, which is the only place allowed to render them.
 * Everything else here (names, roles, timestamps) is still JSX text
 * interpolation, and forum content is no longer pre-stripped by the service.
 *
 * Two surfaces, one component, told apart by `onViewAll`:
 * - CARD (prop passed): shows the last VISIBLE top-level comments and escalates
 *   the rest to the detail modal. The forum's "more on the forum" link is
 *   suppressed — two competing escalations on one card is noise.
 * - MODAL (prop omitted): renders the whole thread. There is nothing left to
 *   expand, which is why this component has no expand state of its own.
 *
 * Composer rules (no toasts, ever):
 * - The in-flight comment renders immediately from the mutation's `variables`
 *   (dimmed), under its parent when it's a reply — optimistic via UI, nothing
 *   written to the cache until the server confirms, so there's no rollback to
 *   get wrong.
 * - The input is cleared ONLY on success; on failure the draft is simply
 *   still there, with an inline error that clears on the next keystroke.
 * - Submit is guarded in the handler (not just the disabled attribute) so
 *   Enter can't double-fire while a submit is in flight.
 * - Forum failures show NodeBB's reason when it's a sentence (too short, too
 *   fast) and a generic line when it's an untranslated `[[error:…]]` key.
 *
 * Writing to a forum post additionally requires `forum.write` — the same gate
 * the /forum page's composer uses. Without it the thread stays fully readable.
 *
 * Delete (author-only, `isOwn`): an inline "Delete this comment? Yes / Cancel"
 * swap on the row — no modal, no toast, matching the composer's style. No
 * optimistic removal: the row shows a disabled Yes while the request is in
 * flight. Deleting cascades to the comment's replies, server-side and in the
 * cache patch alike. NodeBB-sourced comments always report `isOwn: false`, so
 * the affordance never appears on them.
 */
export function FeedCommentsThread({
  itemUid,
  kind,
  source,
  forumMainPid,
  onViewAll,
  onSignIn,
  onBusyChange,
}: FeedCommentsThreadProps) {
  const router = useRouter();
  const analytics = useTeamNewsAnalytics();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { canWrite: canWriteForum } = useForumAccess();
  const [draft, setDraft] = useState('');
  const [confirmingUid, setConfirmingUid] = useState<string | null>(null);
  // One open reply composer at a time — a thread full of open inputs is noise,
  // and the draft belongs to whichever comment the member is answering.
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  // Which composer, if any, refused a submit for exceeding the server's cap on
  // the serialised string. `undefined` = no such failure; `null` = the
  // top-level composer, mirroring how errorParentUid reads.
  const [oversizeParentUid, setOversizeParentUid] = useState<string | null | undefined>(undefined);

  // The only difference between the card and the modal. See the prop's doc.
  const isCard = onViewAll !== undefined;

  const { data, isPending, isError, refetch } = useFeedComments(itemUid, { enabled: true });
  const addComment = useAddFeedComment(itemUid, forumMainPid);
  const deleteComment = useDeleteFeedComment(itemUid);

  const isForumPost = isForumPostUid(itemUid);
  // Forum writes go through NodeBB, which enforces this itself; checking here
  // keeps a member from typing a comment only to have it refused.
  const canComment = !isForumPost || canWriteForum;

  const items = data?.items;
  // Display cap applied once, here: everything below can recurse without
  // re-checking depth.
  const comments = useMemo(() => clampDepth<IFeedComment>(items ?? [], MAX_DEPTH), [items]);
  const totalCount = useMemo(() => countComments(comments), [comments]);

  // NodeBB serves one page of posts per request, so a busy topic's thread is
  // only partly here. Saying "View all N" over a subset would be a lie; the
  // forum link is where the rest actually is.
  const forumTopic = data?.forumTopic;
  const forumTopicUrl = forumTopic?.url ?? undefined;
  const missingReplyCount = forumTopic ? Math.max(0, forumTopic.totalReplyCount - totalCount) : 0;

  const requestDelete = (commentUid: string) => {
    if (deleteComment.isPending) return;
    deleteComment.mutate(
      { commentUid },
      {
        onSuccess: () => setConfirmingUid(null),
      },
    );
  };

  const submit = (text: string, parentUid?: string) => {
    const trimmed = text.trim();
    // isBlankHtml, not `!trimmed` — Quill's empty value is `<p><br></p>`.
    if (isBlankHtml(trimmed) || addComment.isPending) return false;
    // The composer caps VISIBLE characters, but the server caps the serialised
    // string. A mention anchor is ~150 characters of markup behind a name, so
    // a comment that looks well short of the limit can still be refused. Say
    // so here rather than letting it come back as a bare 400.
    if (trimmed.length > FEED_COMMENT_MAX_LENGTH) {
      setOversizeParentUid(parentUid ?? null);
      return false;
    }
    setOversizeParentUid(undefined);
    addComment.mutate(
      { text: trimmed, parentUid },
      {
        onSuccess: () => {
          // UI-local follow-ups only — the cache writes live in the hook's
          // options callbacks, which survive this component unmounting.
          if (parentUid) setReplyingTo(null);
          else setDraft('');
          analytics.onFeedCommentSubmitted(itemUid, kind, source, Boolean(parentUid), countMentions(trimmed));
        },
      },
    );
    return true;
  };

  // Only the selection, never the draft it was typed into.
  const reportMentionSelected = (member: { uid: string; name: string }) => {
    analytics.onFeedCommentMentionSelected(itemUid, kind, source, {
      memberUid: member.uid,
      memberName: member.name,
    });
  };

  const clearError = () => {
    // A stale "couldn't post" must not sit above a fresh draft.
    if (addComment.isError) addComment.reset();
    if (oversizeParentUid !== undefined) setOversizeParentUid(undefined);
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    clearError();
  };

  const goToLogin = () => {
    // A card passes onSignIn so the URL records which thread was open; without
    // it this is a bare /home#login and the member comes back to a collapsed
    // feed with no idea where they were.
    if (onSignIn) {
      onSignIn();
      return;
    }
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  };

  // The last submit attempted, which outlives the request itself — so a failure
  // can be attributed to the composer it came from.
  const attempt = addComment.variables;
  const pending = addComment.isPending ? attempt : undefined;
  const pendingText = pending?.text.trim();
  const errorText = addComment.isError
    ? isForumPost
      ? forumErrorMessage(addComment.error, POST_FAILED)
      : POST_FAILED
    : oversizeParentUid !== undefined
      ? TOO_LONG
      : undefined;
  // `null` = the failure belongs to the top-level composer; a uid = to that
  // comment's reply composer. Without this the same error renders in both.
  const errorParentUid = addComment.isError
    ? errorText
      ? (attempt?.parentUid ?? null)
      : undefined
    : oversizeParentUid;

  // "Latest ref" so the report below keys off the busy flag alone — callers
  // pass an inline arrow, and depending on its identity would re-fire every
  // render. Ref written in an effect, never during render (repo lint rule).
  const busy = addComment.isPending || addComment.isError;
  const onBusyChangeRef = useRef(onBusyChange);
  useEffect(() => {
    onBusyChangeRef.current = onBusyChange;
  });
  useEffect(() => {
    onBusyChangeRef.current?.(busy);
    // Clearing on unmount matters: a card that refused to collapse while busy
    // would otherwise stay stuck open after a filter change remounts it.
    return () => onBusyChangeRef.current?.(false);
  }, [busy]);

  const pendingParentUid = pending?.parentUid;

  // Oldest-first data: the most recent VISIBLE comments are the LAST ones, not
  // the first — a plain slice(0, VISIBLE) would show the oldest instead. Rows
  // the member is mid-interaction with are pinned in, so an append can't
  // unmount one out from under an open composer.
  const shown = useMemo(() => {
    if (!isCard) return comments;
    const activeUids = [replyingTo, confirmingUid, pendingParentUid].filter((uid): uid is string => Boolean(uid));
    return windowWithPinned(comments, VISIBLE, activeUids);
  }, [isCard, comments, replyingTo, confirmingUid, pendingParentUid]);

  // A forum card whose thread fits under the cap can still have replies left on
  // NodeBB, and its "more on the forum" link is suppressed here — so the
  // escalation has to key off both, or that card offers no way through at all.
  const showEscalation = isCard && (comments.length > VISIBLE || missingReplyCount > 0);
  const hasRows = comments.length > 0 || Boolean(pendingText && !pending?.parentUid);

  return (
    <div
      id={feedThreadDomId(itemUid)}
      className={clsx(s.thread, isCard && s.threadCard)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Composer sits above the list — leave a comment first, then read.
          Nothing renders before the auth store hydrates: `currentUser` is null
          either way at that point, so showing the composer would let a guest
          type a comment and get "couldn't post" instead of a login prompt. */}
      {!isHydrated ? null : !currentUser ? (
        <div className={s.signedOut}>
          <span>Join the conversation —</span>
          <button type="button" className={s.signInBtn} onClick={goToLogin}>
            sign in to comment
          </button>
        </div>
      ) : (
        canComment && (
          <div className={s.composer}>
            <Composer
              value={draft}
              onChange={handleDraftChange}
              onSubmit={() => submit(draft)}
              placeholder="Write your comment here…"
              submitLabel="Comment"
              disabled={addComment.isPending}
              onMentionSelected={reportMentionSelected}
            />
            {errorText && errorParentUid === null && (
              <p className={s.error} role="alert">
                {errorText}
              </p>
            )}
          </div>
        )
      )}

      {/* On a card the badge already promised a count, so "loading" and
          "failed" have to be visible states — silence reads as "the comments
          are gone". In the modal these were masked by the article body. */}
      {isPending ? (
        <div className={s.list} aria-busy="true">
          <div className={s.skeletonRow} />
          <div className={s.skeletonRow} />
        </div>
      ) : isError ? (
        <p className={s.error} role="alert">
          Couldn’t load comments —{' '}
          <button type="button" className={s.retryBtn} onClick={() => refetch()}>
            retry
          </button>
        </p>
      ) : !hasRows ? (
        // Reachable with the composer hidden too: a forum member with read but
        // not write access gets neither, so without this the badge expands to
        // an empty box.
        <p className={s.empty}>No comments yet.</p>
      ) : (
        <div className={s.list}>
          {pendingText && !pending?.parentUid && <PendingRow text={pendingText} />}
          {shown.map((comment) => (
            <CommentRow
              key={comment.uid}
              comment={comment}
              depth={0}
              canReply={canComment}
              replyingTo={replyingTo}
              setReplyingTo={(uid) => {
                setReplyingTo(uid);
                clearError();
              }}
              onSubmitReply={submit}
              isSubmitting={addComment.isPending}
              pendingReply={pending?.parentUid ? { parentUid: pending.parentUid, text: pendingText ?? '' } : undefined}
              replyError={errorText && errorParentUid ? { parentUid: errorParentUid, text: errorText } : undefined}
              confirmingUid={confirmingUid}
              onConfirmDelete={setConfirmingUid}
              onDelete={requestDelete}
              isDeletePending={deleteComment.isPending}
              deletingUid={deleteComment.variables?.commentUid}
              deleteFailed={deleteComment.isError}
              resetDelete={deleteComment.reset}
              forumTopicUrl={forumTopicUrl}
              onMentionSelected={reportMentionSelected}
            />
          ))}
          {showEscalation && (
            <button type="button" className={s.viewAll} aria-haspopup="dialog" onClick={onViewAll}>
              {/* totalCount counts what's LOADED. On a forum post with replies
                  still on NodeBB that understates, so drop the number rather
                  than print a wrong one. */}
              {missingReplyCount > 0 ? 'View all comments' : `View all ${totalCount} comments`}
            </button>
          )}
          {!isCard && missingReplyCount > 0 && forumTopicUrl && (
            <a className={s.forumLink} href={forumTopicUrl} target="_blank" rel="noopener noreferrer">
              {missingReplyCount === 1
                ? '1 more comment on the forum →'
                : `${missingReplyCount} more comments on the forum →`}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  submitLabel: string;
  disabled: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
  onMentionSelected: (member: { uid: string; name: string }) => void;
}

/**
 * The composer row, shared by the thread's own input and every reply input.
 *
 * A Quill editor rather than an <input>, so that a mention is written in the
 * forum's own `ql-mention` anchor format — the only encoding that renders on
 * both /home and /forum. Lazy-loaded: Quill stays out of the /home bundle
 * until a member actually opens a composer.
 *
 * Configured down to something that looks like a text field: no toolbar, which
 * also drops the imageUploader module (it is registered only when the toolbar
 * carries 'image') and with it the only code path in RichTextEditor that can
 * fire a toast — banned throughout TeamNews.
 */
function Composer({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  disabled,
  onCancel,
  autoFocus,
  onMentionSelected,
}: ComposerProps) {
  // Quill's "empty" value is `<p><br></p>`, which is truthy — `value.trim()`
  // would have happily enabled submit on an empty composer.
  const canSubmit = !isBlankHtml(value) && !disabled;

  return (
    <form
      className={s.inline}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      // Escape backs out of a reply composer, which is what everyone expects of
      // one. Only inline: inside the modal, Modal's own capture-phase listener
      // sees Escape first and closes the whole dialog.
      onKeyDown={(e) => {
        if (e.key === 'Escape' && onCancel) {
          e.preventDefault();
          onCancel();
        }
      }}
    >
      <div className={s.forumField}>
        <RichTextEditor
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          enableMentions
          onMentionSelected={onMentionSelected}
          // Empty toolbar: no formatting UI, and no imageUploader module.
          toolbarConfig={[]}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          // Counts VISIBLE characters (Quill's getLength), not markup — which
          // is what a member perceives. The server's cap is on the serialised
          // string, so `submit` guards that separately.
          maxLength={FEED_COMMENT_MAX_LENGTH}
          minHeight={40}
        />
      </div>
      {onCancel && (
        <button type="button" className={s.replyCancelBtn} onClick={onCancel}>
          Cancel
        </button>
      )}
      <button
        type="submit"
        className={clsx(s.primaryBtn, s.commentBtn, !canSubmit && s.commentBtnDisabled)}
        disabled={!canSubmit}
      >
        {submitLabel}
      </button>
    </form>
  );
}

/** The viewer's own comment while it's in flight, rendered from the mutation's
 *  variables rather than written to the cache. */
function PendingRow({ text }: { text: string }) {
  const { currentUser } = useCurrentUserStore();
  const name = currentUser?.name ?? 'You';

  return (
    <div className={clsx(s.item, s.itemPending)}>
      <img className={s.avatar} src={currentUser?.profileImageUrl || getDefaultAvatar(name)} alt="" loading="lazy" />
      <div className={s.body}>
        <div className={s.head}>
          <span className={s.name}>{name}</span>
          <span className={s.time}>· posting…</span>
        </div>
        {/* Same pipeline as a landed comment, so a mention or link the member
            just typed doesn't visibly change shape when the server confirms. */}
        <FeedCommentContent html={text} />
      </div>
    </div>
  );
}

interface CommentRowProps {
  comment: IFeedComment;
  depth: number;
  canReply: boolean;
  replyingTo: string | null;
  setReplyingTo: (uid: string | null) => void;
  onSubmitReply: (text: string, parentUid: string) => boolean;
  isSubmitting: boolean;
  pendingReply: { parentUid: string; text: string } | undefined;
  replyError: { parentUid: string; text: string } | undefined;
  confirmingUid: string | null;
  onConfirmDelete: (uid: string | null) => void;
  onDelete: (uid: string) => void;
  isDeletePending: boolean;
  deletingUid: string | undefined;
  deleteFailed: boolean;
  resetDelete: () => void;
  /** Where an attachment-only comment can actually be seen (forum posts only). */
  forumTopicUrl: string | undefined;
  onMentionSelected: (member: { uid: string; name: string }) => void;
}

/**
 * One comment, its reply composer, and its replies. Recursive, but bounded: the
 * tree it renders has already been through clampDepth, so recursion is at most
 * MAX_DEPTH deep and Reply disappears at the cap (a deeper reply would be
 * displayed at the same level as its parent, which reads as a non-sequitur).
 *
 * Reply and delete state is passed down rather than held here — there is one
 * mutation of each kind for the whole thread, and only one row may be replying
 * or confirming at a time.
 */
function CommentRow(props: CommentRowProps) {
  const {
    comment,
    depth,
    canReply,
    replyingTo,
    setReplyingTo,
    onSubmitReply,
    isSubmitting,
    pendingReply,
    replyError,
    confirmingUid,
    onConfirmDelete,
    onDelete,
    isDeletePending,
    deletingUid,
    deleteFailed,
    resetDelete,
    forumTopicUrl,
    onMentionSelected,
  } = props;

  const [replyDraft, setReplyDraft] = useState('');

  const isConfirming = confirmingUid === comment.uid;
  const isDeletingThis = isDeletePending && deletingUid === comment.uid;
  const deleteFailedThis = deleteFailed && deletingUid === comment.uid;
  const isReplying = replyingTo === comment.uid;
  const showReply = canReply && depth < MAX_DEPTH;
  const pendingHere = pendingReply?.parentUid === comment.uid ? pendingReply.text : undefined;
  const errorHere = replyError?.parentUid === comment.uid ? replyError.text : undefined;
  // `name` is nullable on the wire; the fallback keeps the avatar deterministic
  // and the row readable rather than rendering a blank byline.
  const displayName = comment.author.name || 'Member';

  const submitReply = () => {
    if (onSubmitReply(replyDraft, comment.uid)) setReplyDraft('');
  };

  return (
    <div className={s.item}>
      <img className={s.avatar} src={comment.author.avatarUrl || getDefaultAvatar(displayName)} alt="" loading="lazy" />
      <div className={s.body}>
        <div className={s.head}>
          <span className={s.name}>{displayName}</span>
          {comment.author.role && <span className={s.role}>· {comment.author.role}</span>}
          <span className={s.time}>· {formatTimeAgo(comment.createdAt)}</span>
          {comment.isOwn &&
            (isConfirming ? (
              <span className={s.deleteConfirm}>
                Delete this comment?
                <button
                  type="button"
                  className={s.deleteConfirmBtn}
                  disabled={isDeletingThis}
                  onClick={() => onDelete(comment.uid)}
                >
                  {isDeletingThis ? 'Deleting…' : 'Yes'}
                </button>
                <button
                  type="button"
                  className={s.deleteCancelBtn}
                  disabled={isDeletingThis}
                  onClick={() => {
                    onConfirmDelete(null);
                    if (deleteFailed) resetDelete();
                  }}
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button type="button" className={s.deleteBtn} onClick={() => onConfirmDelete(comment.uid)}>
                Delete
              </button>
            ))}
        </div>
        {/* A forum comment that was only an image or a file sanitizes to
            nothing under the feed's three-tag allowlist. Say so and point at
            where it can be seen, rather than rendering a blank row. Asked of
            the sanitized string: the raw one is a truthy `<img src=…>`. */}
        {hasRenderableContent(comment.text) ? (
          <FeedCommentContent html={comment.text} />
        ) : (
          <p className={clsx(s.text, s.textAttachment)}>
            {forumTopicUrl ? (
              <a href={forumTopicUrl} target="_blank" rel="noopener noreferrer" className={s.forumLink}>
                Shared an image or file — view it on the forum →
              </a>
            ) : (
              'Shared an image or file.'
            )}
          </p>
        )}
        {deleteFailedThis && (
          <p className={s.error} role="alert">
            Couldn’t delete — try again.
          </p>
        )}

        {showReply && !isReplying && (
          <button type="button" className={s.replyBtn} onClick={() => setReplyingTo(comment.uid)}>
            Reply
          </button>
        )}

        {isReplying && (
          <div className={s.replyComposer}>
            <Composer
              autoFocus
              value={replyDraft}
              onChange={setReplyDraft}
              onSubmit={submitReply}
              onCancel={() => {
                setReplyDraft('');
                setReplyingTo(null);
              }}
              placeholder={`Reply to ${displayName}…`}
              submitLabel="Reply"
              disabled={isSubmitting}
              onMentionSelected={onMentionSelected}
            />
            {errorHere && (
              <p className={s.error} role="alert">
                {errorHere}
              </p>
            )}
          </div>
        )}

        {(comment.replies.length > 0 || pendingHere) && (
          <div className={s.repliesWrapper}>
            {comment.replies.map((reply) => (
              <CommentRow key={reply.uid} {...props} comment={reply} depth={depth + 1} />
            ))}
            {pendingHere && <PendingRow text={pendingHere} />}
          </div>
        )}
      </div>
    </div>
  );
}
