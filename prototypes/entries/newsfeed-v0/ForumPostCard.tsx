'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { Button } from '@/components/common/Button';
import { ArrowRight } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/components/Icons';

// Reuse the production news-card shell 1:1 so a forum post sits in the feed as a
// news-styled card: author on top (where team news puts the team), then the
// thread title, teaser, and a meta/engagement footer.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import discussStyles from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/StartConversationButton.module.scss';
import local from './NewsfeedV0.module.scss';

import type { ForumPost } from './mocks';

interface ForumPostCardProps {
  post: ForumPost;
}

const openForum = (tid: string) =>
  window.open(`https://directory.plnetwork.io/forum/${tid}`, '_blank', 'noopener,noreferrer');

/**
 * A network forum thread rendered as a news-style card: the author sits on top
 * (mirroring the team on a news card), followed by the thread title, teaser, and
 * a footer of Likes · Comments plus a Join-discussion action. Mocked/static.
 */
export function ForumPostCard({ post }: ForumPostCardProps) {
  return (
    <div className={clsx(s.card, local.feedCard)}>
      <div className={s.head}>
        <img
          className={clsx(s.logo, local.forumAvatar)}
          src={post.authorImage ?? getDefaultAvatar(post.author)}
          alt=""
          loading="lazy"
        />
        <a
          href={`/members/${post.memberUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(s.teamName, local.teamNameTight)}
          onClick={(e) => e.stopPropagation()}
        >
          {post.author}
        </a>
        {post.position && <span className={local.forumByline}>{post.position}</span>}
      </div>

      <div
        role="button"
        tabIndex={0}
        className={local.feedStory}
        onClick={() => openForum(post.tid)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openForum(post.tid);
          }
        }}
      >
        <h3 className={clsx(s.headline, local.feedTitle)}>{post.title}</h3>
        <p className={local.summary}>{post.teaser}</p>
        <div className={local.footer}>
          <span className={local.source}>
            <span className={clsx(local.metaEvent, local.kDiscussion)}>Discussion</span>
            {' · '}
            {post.category}
            {' · '}
            {formatTimeAgo(post.timestamp)}
          </span>
          <span className={local.footerActions} onClick={(e) => e.stopPropagation()}>
            <span className={local.forumStat} title={`${post.meta.likes} likes`}>
              <HeartIcon /> {post.meta.likes}
            </span>
            <span className={local.forumStat} title={`${post.meta.comments} comments`}>
              <CommentIcon /> {post.meta.comments}
            </span>
            <Button
              size="xs"
              style="link"
              variant="primary"
              className={discussStyles.discussLink}
              title="Join this forum discussion"
              onClick={(e) => e.stopPropagation()}
            >
              Join discussion
              <ArrowRight />
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}

const HeartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M8 13.5s-5.2-3.2-5.2-6.8A2.7 2.7 0 0 1 8 4.6a2.7 2.7 0 0 1 5.2 2.1c0 3.6-5.2 6.8-5.2 6.8Z"
      stroke="#8897ae"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

const CommentIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M13.5 3H2.5C2.22 3 2 3.22 2 3.5v10c0 .43.5.66.85.4L5.15 12H13.5c.28 0 .5-.22.5-.5v-8c0-.28-.22-.5-.5-.5Z"
      stroke="#8897ae"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);
