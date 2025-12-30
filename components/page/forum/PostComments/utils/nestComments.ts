import { TopicResponse } from '@/services/forum/hooks/useForumPost';

import { NestedComment } from '../types';

export function nestComments(items: TopicResponse['posts']): NestedComment[] {
  const map = new Map<number, any>();

  // Create a lookup map and add `replies` to each
  for (const item of items) {
    map.set(item.pid, { ...item, replies: [] });
  }

  const roots: any[] = [];

  for (const item of items) {
    const current = map.get(item.pid);
    if (item.parent?.pid && map.has(item.parent.pid)) {
      const parent = map.get(item.parent.pid);
      parent.replies.push(current);
    } else {
      roots.push(current);
    }
  }

  return roots;
}
