import isEmpty from 'lodash/isEmpty';
import InfiniteScroll from 'react-infinite-scroll-component';

import { Topic } from '@/services/forum/hooks/useForumPosts';

import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import type { ForumComment } from '@/components/page/member-details/ForumActivity/hooks/useUserForumComments';
import { ActiveTab } from '@/components/page/member-details/ForumActivity/types';
import { hasForumAccess } from '@/components/page/member-details/ForumActivity/utils/hasForumAccess';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';

import { PostCard } from './components/PostCard';
import { CommentCard } from './components/CommentCard';
import { NoForumActivity } from './components/NoForumActivity';
import { UserNotLoggedForumView } from './components/UserNotLoggedForumView';

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
  hasMore?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  scrollableTarget?: string;
}

export function ForumActivityCardsList(props: Props) {
  const {
    posts,
    member,
    isOwner,
    userInfo,
    comments,
    activeTab,
    isLoading,
    hasMore = false,
    location = 'section',
    fetchNextPage,
    isFetchingNextPage,
    scrollableTarget,
  } = props;

  const { hasAccess: v2ForumAccess } = useForumAccess();
  const hasAccess = USE_ACCESS_CONTROL_V2 ? v2ForumAccess : hasForumAccess(userInfo.accessLevel);
  const hasContent = activeTab === 'posts' ? !isEmpty(posts) : !isEmpty(comments);

  if (isLoading) {
    return <div className={s.loading}>Loading...</div>;
  }

  if (!userInfo) {
    return <UserNotLoggedForumView member={member} activeTab={activeTab} />;
  }

  if (hasContent && hasAccess) {
    const dataLength = activeTab === 'posts' ? posts.length : comments.length;
    const useInfiniteScroll = scrollableTarget && fetchNextPage;

    const content = (
      <div className={s.root}>
        {activeTab === 'posts' &&
          posts.map((post, index) => (
            <PostCard
              key={post.tid}
              post={post}
              memberUid={member.id}
              memberName={member.name}
              location={location}
              position={index}
            />
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
        {isFetchingNextPage && <div className={s.loadingMore}>Loading...</div>}
      </div>
    );

    if (useInfiniteScroll) {
      return (
        <InfiniteScroll
          scrollableTarget={scrollableTarget}
          loader={null}
          hasMore={hasMore}
          dataLength={dataLength}
          next={fetchNextPage}
          style={{ overflow: 'unset' }}
        >
          {content}
        </InfiniteScroll>
      );
    }

    return content;
  }

  return <NoForumActivity isOwner={isOwner} member={member} userInfo={userInfo} activeTab={activeTab} />;
}
