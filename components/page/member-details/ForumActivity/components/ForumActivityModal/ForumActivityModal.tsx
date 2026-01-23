import { Topic } from '@/services/forum/hooks/useForumPosts';
import { ModalBase } from '@/components/common/ModalBase';
import type { ForumComment } from '@/components/page/member-details/ForumActivity/hooks/useUserForumComments';
import { ForumActivityTabs } from '@/components/page/member-details/ForumActivity/components/ForumActivityTabs';
import { ForumActivityCardsList } from '@/components/page/member-details/ForumActivity/components/ForumActivityCardsList';

import s from './ForumActivityModal.module.scss';

interface Props {
  open: boolean;
  toggleOpen: (open?: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  posts: Topic[];
  comments: ForumComment[];
  postsCount: number;
  commentsCount: number;
}

export function ForumActivityModal(props: Props) {
  const { open, toggleOpen, activeTab, setActiveTab, postsCount, commentsCount, posts, comments } = props;

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

          <ForumActivityCardsList activeTab={activeTab} isLoading={false} posts={posts} comments={comments} />
        </div>
      </div>
    </ModalBase>
  );
}
