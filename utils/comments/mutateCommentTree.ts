/**
 * Pure insert/remove over a comment tree, for the feed's cache patches.
 *
 * These exist as functions rather than inline `setQueryData` callbacks because
 * the tree makes both operations easy to get subtly wrong, and both bugs are
 * invisible until a real thread has replies in it:
 *
 * - **Insert** has to find the parent at any depth. Appending to the root list
 *   (what a flat list did) silently promotes every reply to a top-level comment.
 * - **Remove** has to account for the backend's cascade: deleting a comment
 *   deletes its replies too, so the count drops by the whole subtree, not by 1.
 *
 * The generic constraints are self-referential (`replies: N[]`, not
 * `SomeNode[]`) so recursion stays in the caller's own node type — no casts.
 */

/**
 * Append `comment` under its `parentUid`, or at the end of the root list when
 * it's top-level. A parent that isn't in the tree (deleted, or on a page we
 * never loaded) falls back to the root rather than dropping the comment.
 *
 * Order is append-only because every source gives us oldest-first threads.
 */
export function insertCommentIntoTree<N extends { uid: string; parentUid: string | null; replies: N[] }>(
  items: readonly N[],
  comment: N,
): N[] {
  if (comment.parentUid === null) return [...items, comment];

  const { items: inserted, found } = insertUnderParent(items, comment, comment.parentUid);
  return found ? inserted : [...items, comment];
}

function insertUnderParent<N extends { uid: string; parentUid: string | null; replies: N[] }>(
  items: readonly N[],
  comment: N,
  parentUid: string,
): { items: N[]; found: boolean } {
  let found = false;

  const next = items.map((item) => {
    if (found) return item;

    if (item.uid === parentUid) {
      found = true;
      return { ...item, replies: [...item.replies, comment] };
    }

    const child = insertUnderParent(item.replies, comment, parentUid);
    if (!child.found) return item;

    found = true;
    return { ...item, replies: child.items };
  });

  return { items: next, found };
}

/**
 * Drop the comment with `uid` and everything under it, mirroring the backend's
 * cascade. `removedCount` is the size of the removed subtree, so callers can
 * decrement a comment count by the right amount (0 if the comment wasn't in the
 * tree — a stale delete must not move the count).
 */
export function removeCommentFromTree<N extends { uid: string; replies: N[] }>(
  items: readonly N[],
  uid: string,
): { items: N[]; removedCount: number } {
  let removedCount = 0;
  const next: N[] = [];

  for (const item of items) {
    if (item.uid === uid) {
      removedCount += subtreeSize(item);
      continue;
    }

    const child = removeCommentFromTree(item.replies, uid);
    if (child.removedCount === 0) {
      next.push(item);
      continue;
    }

    removedCount += child.removedCount;
    next.push({ ...item, replies: child.items });
  }

  return { items: next, removedCount };
}

function subtreeSize<N extends { replies: N[] }>(node: N): number {
  return 1 + node.replies.reduce((total, reply) => total + subtreeSize(reply), 0);
}
