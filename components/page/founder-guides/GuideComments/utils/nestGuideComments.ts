import type { IGuideComment, NestedGuideComment } from '@/services/guide-comments/guide-comments.types';

export function nestGuideComments(items: IGuideComment[]): NestedGuideComment[] {
  const map = new Map<string, NestedGuideComment>();

  for (const item of items) {
    map.set(item.uid, { ...item, replies: [] });
  }

  const roots: NestedGuideComment[] = [];

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
