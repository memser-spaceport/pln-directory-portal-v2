import Link from 'next/link';

import { type ForumComment } from '../../hooks/useUserForumComments';
import { ForumStats } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumStats';
import { ForumAvatar } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumAvatar';
import { ForumExcerpt } from '@/components/page/member-details/ForumActivity/components/building-blocks/ForumExcerpt';
import { useForumAnalytics } from '@/analytics/forum.analytics';

import s from './CommentCard.module.scss';

interface CommentCardProps {
  comment: ForumComment;
  memberUid?: string;
  memberName?: string;
  location?: 'section' | 'modal';
  position?: number;
}

export function CommentCard(props: CommentCardProps) {
  const { comment, memberUid, memberName, location, position } = props;
  const { onMemberProfileForumActivityCommentCardClicked } = useForumAnalytics();

  const commentContent = comment.content || '';
  const commentUrl = `/forum/topics/${comment.category?.cid}/${comment.topic?.tid}?pid=${comment.pid}`;

  const handleClick = () => {
    if (memberUid && memberName) {
      onMemberProfileForumActivityCommentCardClicked({
        memberUid,
        memberName,
        commentId: comment.pid,
        topicId: comment.topic?.tid,
        topicTitle: comment.topic?.titleRaw,
        location,
        position,
      });
    }
  };

  return (
    <Link href={commentUrl} className={s.card} target="_blank" onClick={handleClick}>
      <div className={s.cardContent}>
        <ForumAvatar
          size="md"
          src={comment.user?.picture}
          name={comment.user?.displayname || comment.user?.username || ''}
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
