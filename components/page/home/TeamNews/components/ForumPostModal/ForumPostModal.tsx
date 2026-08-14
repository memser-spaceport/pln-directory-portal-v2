'use client';

import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import parse from 'html-react-parser';

import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { processPostContent } from '@/components/page/forum/Post';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { linkifyHtml, sanitizeForumPostHtml } from '@/utils/html';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useFeedForumTopicBodyHtml } from '@/services/feed/hooks/useFeedComments';
import type { IFeedForumPost } from '@/types/feed.types';
import { ForumPostTitle } from '@/components/page/home/TeamNews/components/ForumPostTitle';

import { UpvoteButton } from '../NewsCard/components/UpvoteButton';
import { OWN_FORUM_POST_LIKE_REASON } from '../../utils/isOwnForumPost';
import { FeedForumPostShareMenu } from '../NewsShareMenu';
import { FeedCommentsThread } from '../FeedCommentsThread/FeedCommentsThread';

// Shared 680px DS modal chrome (head/body/footer/close) — in-tree reuse of the
// news detail modal's shell, same as ForumPostCard reuses the NewsCard shell.
import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import modalStyles from '../NewsDetailModal/NewsDetailModal.module.scss';
import s from './ForumPostModal.module.scss';

const TITLE_ID = 'forum-post-modal-title';

/** Restore focus to the forum-post row that opened the modal; deep-linked
 *  posts may have no row in the DOM — fall back to the feed root rather than
 *  letting focus drop to <body>. */
function restoreFocusToPostRow(uid: string) {
  const row = document.querySelector<HTMLElement>(`[data-post-uid="${CSS.escape(uid)}"]`);
  const target = row ?? document.querySelector<HTMLElement>('[data-news-feed-root]');
  target?.focus();
}

interface ForumPostModalProps {
  /** Overlay-merged (live likeCount / viewerHasLiked), resolved by TeamNews —
   *  the single source of truth, so the modal can never disagree with the row.
   *  Only viewers with forum access ever get here (TeamNews gates on live
   *  hasAccess and closes this modal on mid-session revocation). */
  post: IFeedForumPost;
  /** Resolved by TeamNews against the signed-in member, for the same reason the
   *  like state is: the modal must not disagree with the row behind it. */
  isOwnPost?: boolean;
  onClose: () => void;
  onLikeToggle: (post: IFeedForumPost) => void;
  useLink?: boolean;
}

/**
 * Detail modal for a feed forum post (ported from the newsfeed-v0 prototype's
 * ForumPostModal, on the production news-modal chrome): author on top,
 * "Discussion" kicker, the post's FULL body, the shared inline comment thread,
 * and Like + Share in the footer.
 *
 * The body renders the same content /forum does, through the forum page's own
 * pipeline (processPostContent → linkify → parse) plus the feed's
 * sanitize-on-read layer — /forum trusts NodeBB's HTML directly, the feed
 * never does. It comes off the comments query (the thread below fetches the
 * whole topic anyway); until that lands, the card's plain-text teaser
 * (`post.body`) stands in via JSX interpolation.
 */
export function ForumPostModal(props: ForumPostModalProps) {
  const { post, useLink, isOwnPost = false, onClose, onLikeToggle } = props;

  // Same share-popover layering rule as the news modal: while the popover is
  // open, the modal's Escape/backdrop closers stand down so one gesture never
  // dismisses both layers.
  const [shareOpen, setShareOpen] = useState(false);

  // Same order as FeedCommentContent, for the same reason: linkify FIRST so
  // the sanitizer checks the anchors it emits, then sanitize, then parse.
  // processPostContent runs before both — it's the forum page's own
  // markdown-image/nbsp step, so an image post renders here exactly as there
  // (its inline <img> style is dropped by the sanitizer; .postBody's CSS is
  // the replacement).
  const bodyHtml = useFeedForumTopicBodyHtml(post.uid);
  const richBody = useMemo(() => {
    // The typeof check is load-bearing: jest.setup.js's global useQuery mock
    // ignores `select` and hands back its stub object, and NodeBB wire data
    // carries no runtime guarantees either.
    if (typeof bodyHtml !== 'string' || !bodyHtml) return null;
    return parse(sanitizeForumPostHtml(linkifyHtml(processPostContent(bodyHtml).processedContent)));
  }, [bodyHtml]);

  const focusOnAttach = useCallback((node: HTMLButtonElement | null) => {
    node?.focus();
  }, []);

  const handleClose = () => {
    restoreFocusToPostRow(post.uid);
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={handleClose}
      ariaLabelledBy={TITLE_ID}
      lockScroll
      inertBackground
      closeOnEscape={!shareOpen}
      closeOnBackdropClick={!shareOpen}
      overlayClassname={modalStyles.mobileOverlay}
      className={clsx(modalStyles.container, modalStyles.modal)}
    >
      <div className={modalStyles.head}>
        <div className={modalStyles.headIdentity}>
          <img
            className={clsx(newsCardStyles.logo, s.authorAvatar)}
            src={post.author.avatarUrl || getDefaultAvatar(post.author.name)}
            alt=""
            loading="lazy"
          />
          <a
            href={`/members/${encodeURIComponent(post.author.memberUid)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={newsCardStyles.teamName}
          >
            {post.author.name}
          </a>
          {post.author.role && <span className={s.authorRole}>· {post.author.role}</span>}
        </div>
        <button
          ref={focusOnAttach}
          type="button"
          className={modalStyles.closeButton}
          aria-label="Close"
          onClick={handleClose}
        >
          <CloseIcon width={20} height={20} color="#0a0c11" />
        </button>
      </div>

      <div className={modalStyles.body}>
        <div className={s.meta}>
          <span className={s.kicker}>Discussion</span>
          {' · '}
          {formatTimeAgo(post.createdAt)}
        </div>

        <ForumPostTitle id={TITLE_ID} post={post} useLink={useLink} className={modalStyles.title} />

        {richBody ? (
          <div className={clsx(modalStyles.content, s.postBody)}>{richBody}</div>
        ) : (
          <p className={clsx(modalStyles.content, modalStyles.contentPlain)}>{post.body}</p>
        )}

        {/* The post's real NodeBB thread. `forumMainPid` is the topic's opening
            post — the reply target for a top-level comment — passed down so the
            write is one request instead of a fetch-then-post. */}
        <FeedCommentsThread itemUid={post.uid} kind="forum" source="news-modal" forumMainPid={post.mainPid} />
      </div>

      <div className={modalStyles.footer}>
        <span className={modalStyles.footerActions}>
          <FeedForumPostShareMenu
            post={post}
            source="news-modal"
            variant="button"
            side="top"
            onOpenChange={setShareOpen}
          />
          <UpvoteButton
            count={post.likeCount}
            voted={post.viewerHasLiked}
            onToggle={() => onLikeToggle(post)}
            disabledReason={isOwnPost ? OWN_FORUM_POST_LIKE_REASON : undefined}
          />
        </span>
      </div>
    </Modal>
  );
}
