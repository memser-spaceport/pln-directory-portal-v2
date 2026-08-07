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
import { LikeButton, CommentButton, ViewCount } from './FeedActions';
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
  onAddComment: (text: string, parentUid?: string) => void;
  /** Like state for comments and replies, keyed by comment uid. */
  isCommentLiked: (commentUid: string) => boolean;
  onToggleCommentLike: (commentUid: string) => void;
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
  isCommentLiked,
  onToggleCommentLike,
  onOpenDetail,
}: Props) {
  const [threadOpen, setThreadOpen] = useState(false);

  // The post's canonical address — the title links to it and Share copies it.
  // Mock posts have no real thread, so they fall back to the forum index.
  const forumUrl = post.forumUrl ?? '/forum';

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

      {/* The story body is a click convenience, not the link — the title below is
          the real one, so it (not this div) carries the tab stop and the a11y role. */}
      <div className={local.feedStory} onClick={onOpenDetail}>
        <h3 className={clsx(s.headline, local.feedTitle)}>
          {/* A genuine <a href> to the thread: ⌘/ctrl+click, middle-click, "Open in
              new tab", and hover-to-see-the-URL all work for free. Only the plain
              click is ours — that one opens the modal instead of navigating. This is
              why no per-card "Open in forum" button is needed; the modal keeps the
              explicit one, where there's room and the reader has committed. */}
          <a
            href={forumUrl}
            className={local.titleLink}
            onClick={(e) => {
              // Modified click → let the browser have it. stopPropagation so the
              // parent div doesn't ALSO open the modal behind the new tab.
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
                e.stopPropagation();
                return;
              }
              e.preventDefault();
              e.stopPropagation();
              onOpenDetail();
            }}
          >
            {post.title}
          </a>
        </h3>
        <p className={local.summary}>{post.body}</p>
        <div className={local.footer}>
          <span className={local.source}>
            <span className={local.metaForum}>Discussion</span>
            {' · '}
            {formatTimeAgo(post.createdAt)}
          </span>
          <span className={local.footerActions} onClick={(e) => e.stopPropagation()}>
            <ShareMenu variant="card" url={forumUrl} />
            {/* A forum post carries a real view count in production, and this is
                the number the post's own thread shows — same order as the forum
                listing card's Views · Likes · Comments. */}
            <ViewCount count={post.views} compact />
            <LikeButton count={likeCount} liked={liked} onToggle={onToggleLike} />
            {showComments && (
              <CommentButton count={comments.length} open={threadOpen} onToggle={() => setThreadOpen((v) => !v)} />
            )}
          </span>
        </div>

        {showComments && threadOpen && (
          <CommentsThread
            comments={comments}
            onAddComment={onAddComment}
            isCommentLiked={isCommentLiked}
            onToggleCommentLike={onToggleCommentLike}
          />
        )}
      </div>
    </div>
  );
}
