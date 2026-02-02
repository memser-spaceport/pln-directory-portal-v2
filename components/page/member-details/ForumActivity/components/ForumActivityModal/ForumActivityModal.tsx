import { useEffect, useRef } from 'react';

import { IUserInfo } from '@/types/shared.types';
import { IMember } from '@/types/members.types';
import { Topic } from '@/services/forum/hooks/useForumPosts';
import { ModalBase } from '@/components/common/ModalBase';
import type { ForumComment } from '@/components/page/member-details/ForumActivity/hooks/useUserForumComments';
import { ForumActivityTabs } from '@/components/page/member-details/ForumActivity/components/ForumActivityTabs';
import { ForumActivityCardsList } from '@/components/page/member-details/ForumActivity/components/ForumActivityCardsList';
import { ActiveTab } from '@/components/page/member-details/ForumActivity/types';
import { useForumAnalytics } from '@/analytics/forum.analytics';

import s from './ForumActivityModal.module.scss';

interface Props {
  open: boolean;
  toggleOpen: (open?: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOwner: boolean;
  member: IMember;
  userInfo: IUserInfo;
  posts: Topic[];
  comments: ForumComment[];
  postsCount: number;
  commentsCount: number;
  fetchNextPostsPage: () => void;
  hasNextPostsPage: boolean;
  isFetchingNextPostsPage: boolean;
  fetchNextCommentsPage: () => void;
  hasNextCommentsPage: boolean;
  isFetchingNextCommentsPage: boolean;
}

const SCROLL_CONTAINER_ID = 'forum-activity-scroll-container';

export function ForumActivityModal(props: Props) {
  const {
    open,
    toggleOpen,
    activeTab,
    setActiveTab,
    member,
    isOwner,
    userInfo,
    postsCount,
    commentsCount,
    posts,
    comments,
    fetchNextPostsPage,
    hasNextPostsPage,
    isFetchingNextPostsPage,
    fetchNextCommentsPage,
    hasNextCommentsPage,
    isFetchingNextCommentsPage,
  } = props;

  const { onMemberProfileForumActivityModalOpened, onMemberProfileForumActivityModalClosed } = useForumAnalytics();
  const prevOpenRef = useRef(open);

  const hasNextPage = activeTab === 'posts' ? hasNextPostsPage : hasNextCommentsPage;
  const isFetchingNextPage = activeTab === 'posts' ? isFetchingNextPostsPage : isFetchingNextCommentsPage;
  const fetchNextPage = activeTab === 'posts' ? fetchNextPostsPage : fetchNextCommentsPage;

  // Track modal opened/closed
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      onMemberProfileForumActivityModalOpened({
        memberUid: member.id,
        memberName: member.name,
        activeTab,
        postsCount,
        commentsCount,
      });
    } else if (!open && prevOpenRef.current) {
      onMemberProfileForumActivityModalClosed({
        memberUid: member.id,
        memberName: member.name,
        activeTab,
      });
    }
    prevOpenRef.current = open;
  }, [open]);

  return (
    <ModalBase
      title=""
      open={open}
      onClose={toggleOpen}
      className={s.root}
      classes={{
        modal: {
          className: s.modal,
        },
      }}
    >
      <div className={s.content}>
        <div className={s.title}>Forum Activity</div>

        <div className={s.body}>
          <ForumActivityTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            postsCount={postsCount}
            commentsCount={commentsCount}
            memberUid={member.id}
            memberName={member.name}
            location="modal"
            tabProps={{
              classes: {
                root: s.tabs,
                tab: s.tab,
              },
            }}
          />

          <div className={s.scrollContainer} id={SCROLL_CONTAINER_ID}>
            <ForumActivityCardsList
              isOwner={isOwner}
              member={member}
              userInfo={userInfo}
              activeTab={activeTab}
              posts={posts}
              comments={comments}
              hasMore={hasNextPage}
              fetchNextPage={fetchNextPage}
              isFetchingNextPage={isFetchingNextPage}
              scrollableTarget={SCROLL_CONTAINER_ID}
            />
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
