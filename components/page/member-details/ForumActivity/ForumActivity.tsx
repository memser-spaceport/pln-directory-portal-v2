import { useState } from 'react';
import { useToggle } from 'react-use';

import { EyeIcon } from '@/components/icons';
import { MemberDetailsSection } from '@/components/page/member-details/building-blocks/MemberDetailsSection';
import { MemberDetailsSectionHeader } from '@/components/page/member-details/building-blocks/MemberDetailsSectionHeader';
import { HeaderActionBtn } from '@/components/page/member-details/building-blocks/MemberDetailsSectionHeader/components/HeaderActionBtn';

import { useUserForumPosts } from './hooks/useUserForumPosts';
import { useUserForumActivity } from './hooks/useUserForumActivity';
import { useUserForumComments } from './hooks/useUserForumComments';

import { ForumActivityTabs } from './components/ForumActivityTabs';
import { ForumActivityModal } from './components/ForumActivityModal';
import { ForumActivityCardsList } from './components/ForumActivityCardsList';

interface ForumActivityProps {
  memberUid: string;
}

const ITEMS_TO_DISPLAY = 2;

export function ForumActivity({ memberUid }: ForumActivityProps) {
  const [open, toggleOpen] = useToggle(false);

  const [activeTab, setActiveTab] = useState('posts');
  const { data: activity } = useUserForumActivity(memberUid);
  const { data: posts, isLoading: postsLoading } = useUserForumPosts(memberUid);
  const { data: comments, isLoading: commentsLoading } = useUserForumComments(memberUid);

  const postsCount = activity?.postsCount ?? 0;
  const commentsCount = activity?.commentsCount ?? 0;

  const displayedPosts = posts?.slice(0, ITEMS_TO_DISPLAY) || [];
  const displayedComments = comments?.slice(0, ITEMS_TO_DISPLAY) || [];

  const isLoading = activeTab === 'posts' ? postsLoading : commentsLoading;

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
        posts={displayedPosts}
        comments={displayedComments}
        activeTab={activeTab}
        isLoading={isLoading}
      />

      <ForumActivityModal
        open={open}
        toggleOpen={toggleOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        posts={posts}
        comments={comments}
        postsCount={postsCount}
        commentsCount={commentsCount}
      />
    </MemberDetailsSection>
  );
}
