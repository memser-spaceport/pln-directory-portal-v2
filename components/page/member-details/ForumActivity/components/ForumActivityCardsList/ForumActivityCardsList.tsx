import isEmpty from 'lodash/isEmpty';

import { Topic } from '@/services/forum/hooks/useForumPosts';

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
  activeTab: ActiveTab;
  isLoading?: boolean;
  posts: Topic[];
  comments: ForumComment[];
}

export function ForumActivityCardsList(props: Props) {
  const { posts, isOwner, userInfo, comments, activeTab, isLoading } = props;

  const hasAccess = hasForumAccess(userInfo.accessLevel);
  const hasContent = activeTab === 'posts' ? !isEmpty(posts) : !isEmpty(comments);

  if (isLoading) {
    return <div className={s.loading}>Loading...</div>;
  }

  if (hasContent && hasAccess) {
    return (
      <div className={s.root}>
        {activeTab === 'posts' && posts.map((post) => <PostCard key={post.tid} post={post} />)}
        {activeTab === 'comments' && comments.map((comment) => <CommentCard key={comment.pid} comment={comment} />)}
      </div>
    );
  }

  return <NoForumActivity isOwner={isOwner} userInfo={userInfo} activeTab={activeTab} />;
}
