'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

// Reuse the production news-card styling 1:1 — a forum post renders in the same
// shell as a news story, with the author on top where a news card shows the team.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import local from './NewsfeedV0.module.scss';

import type { ForumPost, FeedComment } from './mocks';
import { LikeButton, CommentButton } from './FeedActions';
import { ShareMenu } from './ShareMenu';
import { CommentsThread } from './CommentsThread';

interface Props {
  post: ForumPost;
  /** 'with comments' → Like + Share + inline comments; false → Like + Share only. */
  showComments: boolean;
  likeCount: number;
  liked: boolean;
  onToggleLike: () => void;
  comments: FeedComment[];
  onAddComment: (text: string) => void;
  onOpenDetail: () => void;
}

/**
 * A member-authored forum post in the feed, styled exactly like a news card but
 * with the author (avatar + name + role) where a news card shows the team. Same
 * Like control as news; a post carries no "Discuss" link (it IS the discussion)
 * and gains an inline comment thread.
 */
export function ForumPostCard({
  post,
  showComments,
  likeCount,
  liked,
  onToggleLike,
  comments,
  onAddComment,
  onOpenDetail,
}: Props) {
  const [threadOpen, setThreadOpen] = useState(false);

  return (
    <div className={clsx(s.card, local.feedCard)}>
      <div className={s.head}>
        <img className={clsx(s.logo, local.authorAvatar)} src={getDefaultAvatar(post.author)} alt="" loading="lazy" />
        <a
          href={`/members/${post.memberUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(s.teamName, local.teamNameTight)}
          onClick={(e) => e.stopPropagation()}
        >
          {post.author}
        </a>
        <span className={local.authorRole}>· {post.role}</span>
      </div>

      <div
        role="link"
        tabIndex={0}
        className={local.feedStory}
        onClick={onOpenDetail}
        onKeyDown={(e) => {
          // Only the row itself opens the modal — Enter/Space inside the comment
          // composer must not (it bubbles up to this handler).
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetail();
          }
        }}
      >
        <h3 className={clsx(s.headline, local.feedTitle)}>{post.title}</h3>
        <p className={local.summary}>{post.body}</p>
        <div className={local.footer}>
          <span className={local.source}>
            <span className={local.metaForum}>Discussion</span>
            {' · '}
            {formatTimeAgo(post.createdAt)}
          </span>
          <span className={local.footerActions} onClick={(e) => e.stopPropagation()}>
            <ShareMenu variant="card" />
            <LikeButton count={likeCount} liked={liked} onToggle={onToggleLike} />
            {showComments && (
              <CommentButton count={comments.length} open={threadOpen} onToggle={() => setThreadOpen((v) => !v)} />
            )}
          </span>
        </div>

        {showComments && threadOpen && <CommentsThread comments={comments} onAddComment={onAddComment} />}
      </div>
    </div>
  );
}
