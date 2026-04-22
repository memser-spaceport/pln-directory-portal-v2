import { useToggle } from 'react-use';
import { useState, useEffect } from 'react';

import { EyeIcon } from '@/components/icons';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { HeaderActionBtn } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader/components/HeaderActionBtn';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { useForumAnalytics } from '@/analytics/forum.analytics';

import { ActiveTab } from './types';

import { hasForumAccess } from './utils/hasForumAccess';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';

import { useUserForumPosts } from './hooks/useUserForumPosts';
import { useUserForumActivity } from './hooks/useUserForumActivity';
import { useUserForumComments } from './hooks/useUserForumComments';

import { ForumActivityTabs } from './components/ForumActivityTabs';
import { ForumActivityModal } from './components/ForumActivityModal';
import { ForumActivityCardsList } from './components/ForumActivityCardsList';

interface ForumActivityProps {
  userInfo: IUserInfo;
  isOwner: boolean;
  member: IMember;
}

const ITEMS_TO_DISPLAY = 2;

export function ForumActivity(props: ForumActivityProps) {
  const { member, userInfo, isOwner } = props;

  const memberUid = member.id;
  const { onMemberProfileForumActivityShowAllClicked } = useForumAnalytics();

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
  const { hasAccess: v2ForumAccess } = useForumAccess();
  const hasAccess = USE_ACCESS_CONTROL_V2 ? v2ForumAccess : hasForumAccess(userInfo.accessLevel);

  useEffect(() => {
    if (postsCount === 0 && commentsCount > 0) {
      setActiveTab('comments');
    }
  }, [postsCount, commentsCount]);

  if (isLoading || (noForumActivity && (!isOwner || !hasAccess))) {
    return null;
  }

  return (
    <DetailsSection>
      <DetailsSectionHeader title="Forum Activity">
        {!!userInfo && hasAccess && (
          <HeaderActionBtn
            onClick={() => {
              onMemberProfileForumActivityShowAllClicked({
                memberUid,
                memberName: member.name,
                activeTab,
                postsCount,
                commentsCount,
              });
              toggleOpen();
            }}
          >
            <EyeIcon />
            Show All
          </HeaderActionBtn>
        )}
      </DetailsSectionHeader>

      <ForumActivityTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        postsCount={postsCount}
        commentsCount={commentsCount}
        memberUid={memberUid}
        memberName={member.name}
        location="section"
      />

      <ForumActivityCardsList
        isOwner={isOwner}
        member={member}
        userInfo={userInfo}
        posts={displayedPosts}
        comments={displayedComments}
        activeTab={activeTab}
        location="section"
      />

      <ForumActivityModal
        open={open}
        toggleOpen={toggleOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOwner={isOwner}
        userInfo={userInfo}
        member={member}
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
    </DetailsSection>
  );
}
