'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { Modal } from '@/components/common/Modal';

import type { ForumPost, FeedComment } from './mocks';
import { LikeButton, CommentCount } from './FeedActions';
import { CommentsThread } from './CommentsThread';
// Reuse the news detail modal's shell (card / header / scrolling body / pinned
// footer / close / full-screen-on-mobile) so the two detail views feel like one
// system — only the CONTENT is forum-native here.
import s from './FeedDetailModal.module.scss';

interface Props {
  post: ForumPost | null;
  onClose: () => void;
  likeCount: number;
  liked: boolean;
  onToggleLike: () => void;
  comments: FeedComment[];
  onAddComment: (text: string) => void;
}

/**
 * "Simple forum post" detail — what a member post opens as (vs. the AI-news
 * modal). Author on top, the post title + full body, and the forum's own
 * Views · Likes · Comments meta trio in the footer. No AI note, no sources, no
 * Share/Discuss chrome — it IS the discussion.
 */
export function ForumPostModal({ post, onClose, likeCount, liked, onToggleLike, comments, onAddComment }: Props) {
  return (
    <Modal isOpen={Boolean(post)} onClose={onClose} overlayClassname={s.mobileOverlay} className={s.mobileContainer}>
      {post && (
        <div className={s.card}>
          <button type="button" className={s.close} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>

          <div className={s.head}>
            <img className={clsx(s.logo, s.avatar)} src={getDefaultAvatar(post.author)} alt="" />
            <span className={s.headText}>
              <span className={s.name}>{post.author}</span>
              <span className={s.sub}>
                {post.role} · {formatTimeAgo(post.createdAt)}
              </span>
            </span>
          </div>

          <div className={s.body}>
            <span className={s.kicker}>Discussion</span>
            <h2 className={s.title}>{post.title}</h2>
            <p className={s.summary}>{post.body}</p>
            <CommentsThread comments={comments} onAddComment={onAddComment} />
          </div>

          <div className={s.footer}>
            <span className={s.forumMeta}>
              <LikeButton count={likeCount} liked={liked} onToggle={onToggleLike} />
              <CommentCount count={comments.length} />
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
