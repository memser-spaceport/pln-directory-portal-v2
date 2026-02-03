import Link from 'next/link';

import { Topic } from '@/services/forum/hooks/useForumPosts';

import { ForumStats } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumStats';
import { ForumAvatar } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumAvatar';
import { ForumExcerpt } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumExcerpt';
import { useForumAnalytics } from '@/analytics/forum.analytics';

import s from './PostCard.module.scss';

interface PostCardProps {
  post: Omit<Topic, 'teaser'> & {
    content?: string;
  };
  memberUid?: string;
  memberName?: string;
  location?: 'section' | 'modal';
  position?: number;
}

export function PostCard(props: PostCardProps) {
  const { post, memberUid, memberName, location, position } = props;
  const { onMemberProfileForumActivityPostCardClicked } = useForumAnalytics();

  const teaserContent = post.content || '';
  const postUrl = `/forum/topics/${post.cid}/${post.tid}`;

  const handleClick = () => {
    if (memberUid && memberName) {
      onMemberProfileForumActivityPostCardClicked({
        memberUid,
        memberName,
        postId: post.tid,
        postTitle: post.titleRaw,
        postCategoryId: post.cid,
        location,
        position,
      });
    }
  };

  return (
    <Link href={postUrl} className={s.card} target="_blank" onClick={handleClick}>
      <div className={s.cardContent}>
        <ForumAvatar size="md" src={post.user?.picture} name={post.user?.displayname || post.user?.username || ''} />
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
