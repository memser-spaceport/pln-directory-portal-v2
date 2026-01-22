import { useState } from 'react';

import { EyeIcon } from '@/components/icons';
import { Tabs } from '@/components/common/Tabs';
import { MemberDetailsSection } from '@/components/page/member-details/building-blocks/MemberDetailsSection';
import { MemberDetailsSectionHeader } from '@/components/page/member-details/building-blocks/MemberDetailsSectionHeader';
import { HeaderActionBtn } from '@/components/page/member-details/building-blocks/MemberDetailsSectionHeader/components/HeaderActionBtn';

import { useGetTabs } from './hooks/useGetTabs';
import { useUserForumPosts } from './hooks/useUserForumPosts';
import { useUserForumActivity } from './hooks/useUserForumActivity';
import { useUserForumComments } from './hooks/useUserForumComments';

import { PostCard } from './components/PostCard';
import { CommentCard } from './components/CommentCard';

import s from './ForumActivity.module.scss';

interface ForumActivityProps {
  memberUid: string;
}

const ITEMS_TO_DISPLAY = 2;

export function ForumActivity({ memberUid }: ForumActivityProps) {
  const [activeTab, setActiveTab] = useState('posts');
  const { data: activity } = useUserForumActivity(memberUid);
  const { data: posts, isLoading: postsLoading } = useUserForumPosts(memberUid);
  const { data: comments, isLoading: commentsLoading } = useUserForumComments(memberUid);

  const postsCount = activity?.postsCount ?? 0;
  const commentsCount = activity?.commentsCount ?? 0;

  const tabs = useGetTabs({
    activeTab,
    postsCount,
    commentsCount,
  });

  console.log('>>>', posts, comments);

  const displayedPosts = posts?.slice(0, ITEMS_TO_DISPLAY) || [];
  const displayedComments = comments?.slice(0, ITEMS_TO_DISPLAY) || [];

  const hasContent = activeTab === 'posts' ? displayedPosts.length > 0 : displayedComments.length > 0;
  const isLoading = activeTab === 'posts' ? postsLoading : commentsLoading;

  return (
    <MemberDetailsSection>
      <MemberDetailsSectionHeader title="Forum Activity">
        <HeaderActionBtn onClick={() => {}}>
          <EyeIcon />
          Show All
        </HeaderActionBtn>
      </MemberDetailsSectionHeader>
      <Tabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />

      {isLoading && <div className={s.loading}>Loading...</div>}

      {!isLoading && !hasContent && (
        <div className={s.empty}>No {activeTab === 'posts' ? 'posts' : 'comments'} yet</div>
      )}

      {!isLoading && hasContent && (
        <div className={s.cardsList}>
          {activeTab === 'posts' && displayedPosts.map((post) => <PostCard key={post.tid} post={post} />)}
          {activeTab === 'comments' &&
            displayedComments.map((comment) => <CommentCard key={comment.pid} comment={comment} />)}
        </div>
      )}
    </MemberDetailsSection>
  );
}
