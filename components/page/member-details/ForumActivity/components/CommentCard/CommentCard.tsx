import Link from 'next/link';

import { type ForumComment } from '../../hooks/useUserForumComments';
import { ForumStats } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumStats';
import { ForumAvatar } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumAvatar';
import { ForumExcerpt } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumExcerpt';

import s from './CommentCard.module.scss';

interface CommentCardProps {
  comment: ForumComment;
}

export function CommentCard(props: CommentCardProps) {
  const { comment } = props;

  const commentContent = comment.content || '';
  const commentUrl = `/forum/topics/${comment.category?.cid}/${comment.topic?.tid}?pid=${comment.pid}`;

  return (
    <Link href={commentUrl} className={s.card} target="_blank">
      <div className={s.cardContent}>
        <ForumAvatar
          src={comment.user?.picture}
          name={comment.user?.displayname || comment.user?.username || ''}
          size="md"
        />
        <div className={s.postContent}>
          <div className={s.textContent}>
            <h3 className={s.title}>
              <span className={s.repliedTo}>Replied to: </span>
              {comment.topic?.titleRaw}
            </h3>
            <ForumExcerpt content={commentContent} maxLength={150} readMoreLabel="Join discussion" />
          </div>
          <ForumStats timestamp={comment.timestamp} likes={comment.votes} replies={comment.replies} />
        </div>
      </div>
    </Link>
  );
}
