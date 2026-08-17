import clsx from 'clsx';

import type { IFeedForumPost } from '@/types/feed.types';

import newsCardStyles from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';

import s from './ForumPostTitle.module.scss';

interface Props {
  id?: string;
  post: IFeedForumPost;
  className?: string;
  /** Feed cards stay plain text (row click opens the modal). The detail modal
   *  uses this so the title is a real link to the topic in a new tab. */
  asLink?: boolean;
}

export function ForumPostTitle(props: Props) {
  const { id, post, className, asLink = false } = props;

  const headingClassName = clsx(newsCardStyles.headline, s.title, className);

  if (!asLink || !post.forumTopicUrl) {
    return (
      <h3 id={id} className={headingClassName}>
        {post.title}
      </h3>
    );
  }

  return (
    <h3 id={id} className={headingClassName}>
      <a href={post.forumTopicUrl} target="_blank" rel="noopener noreferrer" className={s.link}>
        {post.title}
      </a>
    </h3>
  );
}
