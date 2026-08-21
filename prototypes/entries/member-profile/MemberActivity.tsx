'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import { EyeIcon } from '@/components/icons';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { HeaderActionBtn } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader/components/HeaderActionBtn';

// Production cards, imported not re-created. Their analytics hook calls
// `usePostHog()` and guards on `postHogProps?.capture`, so it no-ops without a
// provider — safe in the prototype host.
import { PostCard } from '@/components/page/member-details/ForumActivity/components/ForumActivityCardsList/components/PostCard';
import { CommentCard } from '@/components/page/member-details/ForumActivity/components/ForumActivityCardsList/components/CommentCard';

// Production stylesheet, imported verbatim.
import list from '@/components/page/member-details/ForumActivity/components/ForumActivityCardsList/ForumActivityCardsList.module.scss';

import { MOCK_FORUM_COMMENTS, MOCK_FORUM_POSTS } from './activityMocks';
import { MOCK_MEMBER } from './mocks';

/** Production's own cap (ForumActivity.ITEMS_TO_DISPLAY). */
const ITEMS_TO_DISPLAY = 2;

type ActivityTab = 'posts' | 'comments';

/**
 * Forum Activity — production's section, reproduced.
 *
 * It briefly carried a third "Bluesky" tab while the two placements were being
 * compared. That option is gone: the posts live in the rail now, so this is
 * production's section again, under production's title. The rename to
 * "Activity" existed only because the section had gained a non-forum source —
 * with the source gone, so is the reason.
 *
 * Kept in the prototype rather than removed with the tab: it is a real section
 * of the real page, and the rail card has to be judged against a profile of the
 * length it actually has.
 */
export function MemberActivity() {
  const [activeTab, setActiveTab] = useState<ActivityTab>('posts');

  const postsCount = MOCK_FORUM_POSTS.length;
  const commentsCount = MOCK_FORUM_COMMENTS.length;

  const tabs = useMemo(
    () => [
      {
        label: 'Posts',
        value: 'posts',
        badge: <Badge variant={activeTab === 'posts' ? 'brand' : 'default'}>{postsCount}</Badge>,
      },
      {
        label: 'Comments',
        value: 'comments',
        badge: <Badge variant={activeTab === 'comments' ? 'brand' : 'default'}>{commentsCount}</Badge>,
      },
    ],
    [activeTab, postsCount, commentsCount],
  );

  return (
    <DetailsSection>
      <DetailsSectionHeader title="Forum Activity">
        {/* Production opens a modal here. That modal is out of scope for this
            prototype, so the control renders disabled rather than lying. */}
        <HeaderActionBtn onClick={() => {}} disabled>
          <EyeIcon />
          Show All
        </HeaderActionBtn>
      </DetailsSectionHeader>

      <Tabs tabs={tabs} value={activeTab} onValueChange={(v) => setActiveTab(v as ActivityTab)} />

      <div className={list.root}>
        {activeTab === 'posts' &&
          MOCK_FORUM_POSTS.slice(0, ITEMS_TO_DISPLAY).map((post, i) => (
            <PostCard
              key={post.tid}
              post={post}
              memberUid={MOCK_MEMBER.id}
              memberName={MOCK_MEMBER.name}
              position={i}
            />
          ))}

        {activeTab === 'comments' &&
          MOCK_FORUM_COMMENTS.slice(0, ITEMS_TO_DISPLAY).map((comment, i) => (
            <CommentCard
              key={comment.pid}
              comment={comment}
              memberUid={MOCK_MEMBER.id}
              memberName={MOCK_MEMBER.name}
              position={i}
            />
          ))}
      </div>
    </DetailsSection>
  );
}
