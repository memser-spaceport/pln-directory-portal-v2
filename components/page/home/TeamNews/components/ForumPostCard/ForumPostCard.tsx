'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { useTeamNewsAnalytics, type TeamNewsCardClickVia } from '@/analytics/team-news.analytics';
import type { IFeedForumPost } from '@/types/feed.types';

// Shared news-card shell (.card/.head/.logo/.teamName/.headline) — established
// in-tree reuse; a forum post renders in the same shell as a news story, with
// the author on top where a news card shows the team.
import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import { UpvoteButton } from '../NewsCard/components/UpvoteButton/UpvoteButton';
import { CommentButton } from '../NewsCard/components/CommentButton/CommentButton';
import { FeedForumPostShareMenu } from '../NewsShareMenu';
import { ViewCount } from '../ViewCount/ViewCount';
import { FeedCommentsThread, feedThreadDomId } from '../FeedCommentsThread/FeedCommentsThread';

import { ForumPostTitle } from '../ForumPostTitle';
import { OWN_FORUM_POST_LIKE_REASON } from '../../utils/isOwnForumPost';

import s from './ForumPostCard.module.scss';

interface ForumPostCardProps {
  /** Like fields (likeCount / viewerHasLiked) arrive overlay-merged by TeamNews,
   *  same as news items' upvote fields. */
  post: IFeedForumPost;
  position: number;
  /** Resolved by TeamNews against the signed-in member, like the like state
   *  itself, so the card and the modal can never disagree about it. */
  isOwnPost?: boolean;
  onOpenDetail: (post: IFeedForumPost) => void;
  onLikeToggle: (post: IFeedForumPost) => void;
}

/**
 * A member-authored forum post in the feed (ported from the newsfeed-v0
 * prototype). Only viewers with forum access ever see this card — TeamNews
 * gates rendering on live useForumAccess().hasAccess — so unlike NewsCard
 * there is no signed-out #login branch here. Title/body/author render via JSX
 * text interpolation only (plain text per the feed contract).
 */
export function ForumPostCard(props: ForumPostCardProps) {
  const { post, position, isOwnPost = false, onOpenDetail, onLikeToggle } = props;

  const analytics = useTeamNewsAnalytics();
  const [threadOpen, setThreadOpen] = useState(false);
  // See NewsGroupCard: an unsettled comment blocks collapse, because the
  // mutation's error state does not survive the unmount its cache writes do.
  const [threadBusy, setThreadBusy] = useState(false);

  const handleOpenDetail = (via: TeamNewsCardClickVia = 'row') => {
    analytics.onFeedForumPostCardClicked(post, position, 'home', via);
    onOpenDetail(post);
  };

  const handleThreadToggle = () => {
    if (threadOpen && threadBusy) return;
    const next = !threadOpen;
    setThreadOpen(next);
    analytics.onFeedCommentThreadToggled(post.uid, 'forum', next, 'home');
    // See NewsGroupCard: `nearest` reveals a thread opened near the viewport
    // bottom without ever scrolling the feed to the top.
    if (next) {
      requestAnimationFrame(() => {
        document.getElementById(feedThreadDomId(post.uid))?.scrollIntoView({ block: 'nearest' });
      });
    }
  };

  return (
    <div className={clsx(newsCardStyles.card, s.feedCard)}>
      <div className={newsCardStyles.head}>
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
          className={clsx(newsCardStyles.teamName, s.authorName)}
          onClick={(e) => e.stopPropagation()}
        >
          {post.author.name}
        </a>
        {post.author.role && <span className={s.authorRole}>· {post.author.role}</span>}
      </div>

      <div
        role="link"
        tabIndex={0}
        data-post-uid={post.uid}
        className={s.story}
        onClick={() => handleOpenDetail()}
        onKeyDown={(e) => {
          // Only the row itself opens the modal — Enter/Space on a nested
          // control must not (it bubbles up to this handler).
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenDetail();
          }
        }}
      >
        <ForumPostTitle post={post} />
        <p className={s.summary}>{post.body}</p>
        <div className={s.footer}>
          <span className={s.source}>
            <span className={s.metaForum}>Discussion</span>
            {' · '}
            {formatTimeAgo(post.createdAt)}
          </span>
          <span className={s.footerActions} onClick={(e) => e.stopPropagation()}>
            <FeedForumPostShareMenu post={post} source="home" />
            <ViewCount count={post.viewCount} />
            <UpvoteButton
              count={post.likeCount}
              voted={post.viewerHasLiked}
              onToggle={() => onLikeToggle(post)}
              disabledReason={isOwnPost ? OWN_FORUM_POST_LIKE_REASON : undefined}
            />
            <CommentButton
              itemUid={post.uid}
              open={threadOpen}
              onToggle={handleThreadToggle}
              controls={feedThreadDomId(post.uid)}
            />
          </span>
        </div>

        {/* Mount = expanded (the lazy comments query keys off it). */}
        {threadOpen && (
          <FeedCommentsThread
            itemUid={post.uid}
            kind="forum"
            source="home"
            forumMainPid={post.mainPid}
            onViewAll={() => handleOpenDetail('view-all-comments')}
            onBusyChange={setThreadBusy}
          />
        )}
      </div>
    </div>
  );
}
