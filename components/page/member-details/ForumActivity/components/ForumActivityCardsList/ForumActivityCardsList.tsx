import { clsx } from 'clsx';

import type { ForumComment } from '@/components/page/member-details/ForumActivity/hooks/useUserForumComments';
import { PostCard } from '@/components/page/member-details/ForumActivity/components/PostCard';
import { CommentCard } from '@/components/page/member-details/ForumActivity/components/CommentCard';
import { Topic } from '@/services/forum/hooks/useForumPosts';

import s from './ForumActivityCardsList.module.scss';

interface Props {
  activeTab: string;
  isLoading: boolean;
  posts: Topic[];
  comments: ForumComment[];
}

export function ForumActivityCardsList(props: Props) {
  const { posts, comments, activeTab, isLoading } = props;

  const hasContent = activeTab === 'posts' ? posts.length > 0 : comments.length > 0;

  if (isLoading) {
    return <div className={s.loading}>Loading...</div>;
  }

  if (!isLoading && !hasContent) {
    return <div className={s.empty}>No {activeTab === 'posts' ? 'posts' : 'comments'} yet</div>;
  }

  if (!isLoading && hasContent) {
    return (
      <div className={s.list}>
        {activeTab === 'posts' && posts.map((post) => <PostCard key={post.tid} post={post} />)}
        {activeTab === 'comments' && comments.map((comment) => <CommentCard key={comment.pid} comment={comment} />)}
      </div>
    );
  }

  return null;
}
