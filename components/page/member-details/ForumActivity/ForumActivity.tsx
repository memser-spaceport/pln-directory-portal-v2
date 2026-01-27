import { useState } from 'react';
import { useToggle } from 'react-use';

import { EyeIcon } from '@/components/icons';
import { IUserInfo } from '@/types/shared.types';
import { MemberDetailsSection } from '@/components/page/member-details/building-blocks/MemberDetailsSection';
import { MemberDetailsSectionHeader } from '@/components/page/member-details/building-blocks/MemberDetailsSectionHeader';
import { HeaderActionBtn } from '@/components/page/member-details/building-blocks/MemberDetailsSectionHeader/components/HeaderActionBtn';

import { useUserForumPosts } from './hooks/useUserForumPosts';
import { useUserForumActivity } from './hooks/useUserForumActivity';
import { useUserForumComments } from './hooks/useUserForumComments';

import { ForumActivityTabs } from './components/ForumActivityTabs';
import { ForumActivityModal } from './components/ForumActivityModal';
import { ForumActivityCardsList } from './components/ForumActivityCardsList';
import { hasForumAccess } from '@/components/page/member-details/ForumActivity/utils/hasForumAccess';
import { ActiveTab } from '@/components/page/member-details/ForumActivity/types';

interface ForumActivityProps {
  memberUid: string;
  userInfo: IUserInfo;
  isOwner: boolean;
}

const ITEMS_TO_DISPLAY = 2;

export function ForumActivity(props: ForumActivityProps) {
  const { memberUid, userInfo, isOwner } = props;

  console.log('>>>', userInfo);

  const [open, toggleOpen] = useToggle(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('posts');
  const { data: activity } = useUserForumActivity(memberUid);
  const {
    data: posts,
    isLoading: postsLoading,
    fetchNextPage: fetchNextPostsPage,
    hasNextPage: hasNextPostsPage,
    isFetchingNextPage: isFetchingNextPostsPage,
  } = useUserForumPosts(memberUid);

  const {
    data: comments,
    isLoading: commentsLoading,
    fetchNextPage: fetchNextCommentsPage,
    hasNextPage: hasNextCommentsPage,
    isFetchingNextPage: isFetchingNextCommentsPage,
  } = useUserForumComments(memberUid);

  const postsCount = activity?.postsCount ?? 0;
  const commentsCount = activity?.commentsCount ?? 0;
  const noForumActivity = !postsCount && !commentsCount;

  const displayedPosts = posts?.slice(0, ITEMS_TO_DISPLAY) || [];
  const displayedComments = comments?.slice(0, ITEMS_TO_DISPLAY) || [];

  const isLoading = activeTab === 'posts' ? postsLoading : commentsLoading;
  const hasAccess = hasForumAccess(userInfo.accessLevel);

  if (isLoading || (noForumActivity && (!isOwner || !hasAccess))) {
    return null;
  }

  return (
    <MemberDetailsSection>
      <MemberDetailsSectionHeader title="Forum Activity">
        <HeaderActionBtn onClick={toggleOpen}>
          <EyeIcon />
          Show All
        </HeaderActionBtn>
      </MemberDetailsSectionHeader>

      <ForumActivityTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        postsCount={postsCount}
        commentsCount={commentsCount}
      />

      <ForumActivityCardsList
        isOwner={isOwner}
        userInfo={userInfo}
        posts={displayedPosts}
        comments={displayedComments}
        activeTab={activeTab}
      />

      <ForumActivityModal
        open={open}
        toggleOpen={toggleOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOwner={isOwner}
        userInfo={userInfo}
        posts={posts}
        comments={comments}
        postsCount={postsCount}
        commentsCount={commentsCount}
        fetchNextPostsPage={fetchNextPostsPage}
        hasNextPostsPage={hasNextPostsPage}
        isFetchingNextPostsPage={isFetchingNextPostsPage}
        fetchNextCommentsPage={fetchNextCommentsPage}
        hasNextCommentsPage={hasNextCommentsPage}
        isFetchingNextCommentsPage={isFetchingNextCommentsPage}
      />
    </MemberDetailsSection>
  );
}
