import Link from 'next/link';

import { Topic } from '@/services/forum/hooks/useForumPosts';

import { ForumStats } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumStats';
import { ForumAvatar } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumAvatar';
import { ForumExcerpt } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumExcerpt';

import s from './PostCard.module.scss';

interface PostCardProps {
  post: Omit<Topic, 'teaser'> & {
    content?: string;
  };
}

export function PostCard(props: PostCardProps) {
  const { post } = props;

  const teaserContent = post.content || '';
  const postUrl = `/forum/topics/${post.cid}/${post.tid}`;

  return (
    <Link href={postUrl} className={s.card} target="_blank">
      <div className={s.cardContent}>
        <ForumAvatar
          src={post.user?.picture}
          name={post.user?.displayname || post.user?.username || ''}
          memberUid={post.user?.memberUid}
          size="md"
          linkToProfile
        />
        <div className={s.postContent}>
          <div className={s.textContent}>
            <h3 className={s.title}>{post.titleRaw}</h3>
            <ForumExcerpt content={teaserContent} maxLength={150} />
          </div>
          <ForumStats
            timestamp={post.timestamp}
            views={post.viewcount}
            likes={post.votes}
            comments={post.postcount - 1}
          />
        </div>
      </div>
    </Link>
  );
}
