import { TopicResponse } from '@/services/forum/hooks/useForumPost';
import { buildCommentTree } from '@/utils/comments';

import { NestedComment } from '../types';

/**
 * NodeBB's flat post list → a reply tree, nested on `parent.pid`.
 *
 * The algorithm lives in utils/comments/buildCommentTree so the /home feed can
 * nest the same NodeBB payload the same way (it reads forum-post comments
 * straight from the forum now). This wrapper keeps the forum's call site and
 * types unchanged.
 */
export function nestComments(items: TopicResponse['posts']): NestedComment[] {
  return buildCommentTree<TopicResponse['posts'][number], NestedComment>({
    items,
    idOf: (item) => item.pid,
    parentIdOf: (item) => item.parent?.pid,
    makeNode: (item) => ({ ...item, replies: [] }),
  });
}
