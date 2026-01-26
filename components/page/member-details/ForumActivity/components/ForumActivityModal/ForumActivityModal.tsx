import { useState, useEffect, useCallback, useMemo } from 'react';

import { Topic } from '@/services/forum/hooks/useForumPosts';
import { ModalBase } from '@/components/common/ModalBase';
import { Pagination } from '@/components/common/Pagination';
import type { ForumComment } from '@/components/page/member-details/ForumActivity/hooks/useUserForumComments';
import { ForumActivityTabs } from '@/components/page/member-details/ForumActivity/components/ForumActivityTabs';
import { ForumActivityCardsList } from '@/components/page/member-details/ForumActivity/components/ForumActivityCardsList';
import { ActiveTab } from '@/components/page/member-details/ForumActivity/types';

import s from './ForumActivityModal.module.scss';
import { IUserInfo } from '@/types/shared.types';

const PAGE_SIZE = 10;

interface Props {
  open: boolean;
  toggleOpen: (open?: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOwner: boolean;
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

export function ForumActivityModal(props: Props) {
  const {
    open,
    toggleOpen,
    activeTab,
    setActiveTab,
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

  const [postsPage, setPostsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);

  const totalPostsPages = Math.ceil(postsCount / PAGE_SIZE);
  const totalCommentsPages = Math.ceil(commentsCount / PAGE_SIZE);

  const currentPage = activeTab === 'posts' ? postsPage : commentsPage;
  const setCurrentPage = activeTab === 'posts' ? setPostsPage : setCommentsPage;
  const totalPages = activeTab === 'posts' ? totalPostsPages : totalCommentsPages;

  const items = activeTab === 'posts' ? posts : comments;
  const hasNextPage = activeTab === 'posts' ? hasNextPostsPage : hasNextCommentsPage;
  const isFetchingNextPage = activeTab === 'posts' ? isFetchingNextPostsPage : isFetchingNextCommentsPage;
  const fetchNextPage = activeTab === 'posts' ? fetchNextPostsPage : fetchNextCommentsPage;

  // Calculate which items to display for the current page
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;

  const paginatedPosts = useMemo(() => posts.slice(startIndex, endIndex), [posts, startIndex, endIndex]);
  const paginatedComments = useMemo(() => comments.slice(startIndex, endIndex), [comments, startIndex, endIndex]);

  // Check if we need to fetch more data for the current page
  const needsMoreData = endIndex > items.length && hasNextPage;

  // Fetch more data when needed
  useEffect(() => {
    if (needsMoreData && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [needsMoreData, isFetchingNextPage, fetchNextPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage],
  );

  // Reset pagination when modal closes
  useEffect(() => {
    if (!open) {
      setPostsPage(1);
      setCommentsPage(1);
    }
  }, [open]);

  // Determine if we're loading data for the current page
  const isLoadingCurrentPage = isFetchingNextPage && needsMoreData;

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
            tabProps={{
              classes: {
                root: s.tabs,
                tab: s.tab,
              },
            }}
          />

          <ForumActivityCardsList
            isOwner={isOwner}
            userInfo={userInfo}
            activeTab={activeTab}
            isLoading={isLoadingCurrentPage}
            posts={paginatedPosts}
            comments={paginatedComments}
          />

          {totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              disabled={isFetchingNextPage}
              className={s.pagination}
            />
          )}
        </div>
      </div>
    </ModalBase>
  );
}
