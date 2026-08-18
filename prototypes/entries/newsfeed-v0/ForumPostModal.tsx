'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
// Same production modal chrome the news detail modal reuses (sticky header
// divider, rounded close button, sticky footer).
import dealModal from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';

import type { ForumPost, FeedComment } from './mocks';
import { LikeButton, CommentCount, ViewCount } from './FeedActions';
import { CommentsThread } from './CommentsThread';
import { ShareMenu } from './ShareMenu';
// Reuse the news detail modal's shell (card / header / scrolling body / pinned
// footer / close / full-screen-on-mobile) so the two detail views feel like one
// system — only the CONTENT is forum-native here.
import s from './FeedDetailModal.module.scss';
import fa from './FeedActions.module.scss';

interface Props {
  post: ForumPost | null;
  onClose: () => void;
  likeCount: number;
  liked: boolean;
  onToggleLike: () => void;
  comments: FeedComment[];
  onAddComment: (text: string, parentUid?: string) => void;
  /** Like state for comments and replies, keyed by comment uid. */
  isCommentLiked: (commentUid: string) => boolean;
  onToggleCommentLike: (commentUid: string) => void;
}

/**
 * "Simple forum post" detail — what a member post opens as (vs. the AI-news
 * modal). Author on top, the post title + full body, and the forum's own
 * Views · Likes · Comments meta trio in the footer. No AI note, no sources, no
 * Share/Discuss chrome — it IS the discussion.
 */
export function ForumPostModal({
  post,
  onClose,
  likeCount,
  liked,
  onToggleLike,
  comments,
  onAddComment,
  isCommentLiked,
  onToggleCommentLike,
}: Props) {
  // One address for the post, used by both outbound actions. Mock posts have no
  // real thread, so they fall back to the forum index.
  const forumUrl = post?.forumUrl ?? '/forum';

  return (
    <Modal isOpen={Boolean(post)} onClose={onClose} overlayClassname={s.mobileOverlay} className={s.container}>
      {post && (
        <div className={s.card}>
          <div className={clsx(dealModal.header, s.head)}>
            <div className={s.headIdentity}>
              <img className={clsx(s.logo, s.avatar)} src={getDefaultAvatar(post.author)} alt="" />
              <span className={s.headText}>
                <span className={s.name}>{post.author}</span>
                <span className={s.sub}>
                  {post.role} · {formatTimeAgo(post.createdAt)}
                </span>
              </span>
            </div>
            <button type="button" className={dealModal.closeButton} aria-label="Close" onClick={onClose}>
              <CloseIcon width={20} height={20} color="#0a0c11" />
            </button>
          </div>

          <div className={s.body}>
            <span className={s.kicker}>Discussion</span>
            <h2 className={s.title}>{post.title}</h2>
            <p className={s.summary}>{post.body}</p>
            <CommentsThread
              heading
              comments={comments}
              onAddComment={onAddComment}
              isCommentLiked={isCommentLiked}
              onToggleCommentLike={onToggleCommentLike}
            />
          </div>

          <div className={clsx(dealModal.footer, s.footer, s.footerSplit)}>
            {/* The modal carries the whole post and every comment — what it can't be
                is ADDRESSABLE. The thread has a URL you can link, bookmark, or land
                on at a specific comment (production Post reads ?pid= / ?replyTo=,
                which the notification emails rely on), and it renders the body's
                HTML — images, auto-linked URLs — where this shows plain text. New
                tab so the feed and the reader's scroll position survive. */}
            {/* Left: the actions that point OUT of the modal, both at the thread's
                own URL — so "open" and "copy link" agree on where the post lives.
                Share is LEFTMOST in both modals (the news one has only Share there),
                so it lands at the same spot whichever detail view you're in; "Open
                in forum" is the extra this modal alone carries. The menu aligns left
                because the trigger sits on the left of a clipped card. */}
            <span className={s.footerActions}>
              <ShareMenu variant="modal" url={forumUrl} align="left" />
              <a
                className={clsx(fa.subItem, fa.button, s.openInForum)}
                href={forumUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in forum
                <ExternalLinkIcon />
              </a>
            </span>
            {/* Right: the forum's own meta trio, in production's order and wording
                (Post.tsx renders Views · Likes · Comments). */}
            <span className={s.forumMeta}>
              <ViewCount count={post.views} />
              <LikeButton count={likeCount} liked={liked} onToggle={onToggleLike} />
              <CommentCount count={comments.length} />
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}

// Arrow-out-of-box ↗ — same 1.2 stroke weight as the forum meta-row icons.
const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M9.5 2.5H13.5V6.5M13.5 2.5L7.5 8.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.5 9.5v3a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
