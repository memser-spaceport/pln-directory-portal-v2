import type { IGuideComment } from '@/services/guide-comments/guide-comments.types';

/**
 * Builds a nested comment tree from a flat list.
 * Not needed when the API already returns nested data (replies embedded),
 * but kept as a utility for any flat-list scenarios.
 */
export function nestGuideComments(items: IGuideComment[]): IGuideComment[] {
  const map = new Map<string, IGuideComment>();

  for (const item of items) {
    map.set(item.uid, { ...item, replies: [] });
  }

  const roots: IGuideComment[] = [];

  for (const item of items) {
    const current = map.get(item.uid)!;
    if (item.parentUid && map.has(item.parentUid)) {
      map.get(item.parentUid)!.replies.push(current);
    } else {
      roots.push(current);
    }
  }

  return roots;
}
