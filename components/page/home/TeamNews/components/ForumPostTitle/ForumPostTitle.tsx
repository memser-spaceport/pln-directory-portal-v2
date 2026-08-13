import clsx from 'clsx';
import Link from 'next/link';

import type { IFeedForumPost } from '@/types/feed.types';

import { useWriteUrl } from '@/components/page/home/TeamNews/hooks/useWriteUrl';

import newsCardStyles from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';

import { POST_PARAM } from '../../hooks/useForumPostDeepLink';

import s from './ForumPostTitle.module.scss';

interface Props {
  id?: string;
  useLink?: boolean;
  post: IFeedForumPost;
  className?: string;
}

export function ForumPostTitle(props: Props) {
  const { id, post, useLink = false, className } = props;

  const writeUrl = useWriteUrl();

  const title = (
    <h3 id={id} className={clsx(newsCardStyles.headline, s.title, className)}>
      {post.title}
    </h3>
  );

  if (useLink) {
    return (
      <Link href={post.forumTopicUrl || ''} className={s.link} onClick={(e) => {
        writeUrl(POST_PARAM);
        e.stopPropagation()
      }}>
        {title}
      </Link>
    );
  }

  return title;
}
