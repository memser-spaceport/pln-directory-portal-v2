import isEmpty from 'lodash/isEmpty';

import { Topic } from '@/services/forum/hooks/useForumPosts';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import type { ForumComment } from '@/components/page/member-details/ForumActivity/hooks/useUserForumComments';
import { PostCard } from '@/components/page/member-details/ForumActivity/components/PostCard';
import { CommentCard } from '@/components/page/member-details/ForumActivity/components/CommentCard';
import { ActiveTab } from '@/components/page/member-details/ForumActivity/types';
import { NoForumActivity } from '@/components/page/member-details/ForumActivity/components/NoForumActivity';
import { hasForumAccess } from '@/components/page/member-details/ForumActivity/utils/hasForumAccess';

import s from './ForumActivityCardsList.module.scss';

interface Props {
  isOwner: boolean;
  userInfo: IUserInfo;
  member: IMember;
  activeTab: ActiveTab;
  isLoading?: boolean;
  posts: Topic[];
  comments: ForumComment[];
  location?: 'section' | 'modal';
}

export function ForumActivityCardsList(props: Props) {
  const { posts, member, isOwner, userInfo, comments, activeTab, isLoading, location = 'section' } = props;

  const hasAccess = hasForumAccess(userInfo.accessLevel);
  const hasContent = activeTab === 'posts' ? !isEmpty(posts) : !isEmpty(comments);

  if (isLoading) {
    return <div className={s.loading}>Loading...</div>;
  }

  if (hasContent && hasAccess) {
    return (
      <div className={s.root}>
        {activeTab === 'posts' &&
          posts.map((post, index) => (
            <PostCard key={post.tid} post={post} memberUid={member.id} memberName={member.name} location={location} position={index} />
          ))}
        {activeTab === 'comments' &&
          comments.map((comment, index) => (
            <CommentCard
              key={comment.pid}
              comment={comment}
              memberUid={member.id}
              memberName={member.name}
              location={location}
              position={index}
            />
          ))}
      </div>
    );
  }

  return <NoForumActivity isOwner={isOwner} member={member} userInfo={userInfo} activeTab={activeTab} />;
}
