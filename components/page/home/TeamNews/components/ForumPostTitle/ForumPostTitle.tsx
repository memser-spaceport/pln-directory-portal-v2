import clsx from 'clsx';

import type { IFeedForumPost } from '@/types/feed.types';

import { useWriteUrl } from '@/components/page/home/TeamNews/hooks/useWriteUrl';

import newsCardStyles from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';

import s from './ForumPostTitle.module.scss';

interface Props {
  id?: string;
  post: IFeedForumPost;
  className?: string;
}

export function ForumPostTitle(props: Props) {
  const { id, post, className } = props;

  const headingClassName = clsx(newsCardStyles.headline, s.title, className);

  if (!post.forumTopicUrl) {
    return (
      <h3 id={id} className={headingClassName}>
        {post.title}
      </h3>
    );
  }

  return (
    <h3 id={id} className={headingClassName}>
      <a
        href={post.forumTopicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={s.link}
        onClick={(e) => e.stopPropagation()}
      >
        {post.title}
      </a>
    </h3>
  );
}
