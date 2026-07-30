/**
 * Flat comment list → tree, shared by the two comment systems that render in
 * the same UI: the forum's NodeBB posts (nested on `parent.pid`) and the feed's
 * NodeBB-sourced comments. The directory backend already returns a tree, so it
 * doesn't need this.
 *
 * Guarantees, in order of why they exist:
 * - **Nothing disappears.** A reply whose parent isn't in `items` (paginated
 *   away, deleted, out of window) becomes a root rather than vanishing.
 * - **No cycles reach the renderer.** A comment whose parent chain leads back
 *   to itself is promoted to a root instead of being attached — an attached
 *   cycle would infinitely recurse the recursive comment component.
 * - **Input order is preserved** at every level: callers hand us
 *   oldest-first data and get oldest-first replies back.
 */

interface BuildCommentTreeArgs<T, N> {
  items: readonly T[];
  idOf: (item: T) => string | number;
  /** `null`/`undefined` (or an id not present in `items`) ⇒ this is a root. */
  parentIdOf: (item: T) => string | number | null | undefined;
  /** Build the render node for one item, with an empty `replies` array. */
  makeNode: (item: T) => N;
}

export function buildCommentTree<T, N extends { replies: N[] }>({
  items,
  idOf,
  parentIdOf,
  makeNode,
}: BuildCommentTreeArgs<T, N>): N[] {
  const nodes = new Map<string | number, N>();
  for (const item of items) nodes.set(idOf(item), makeNode(item));

  // Only edges whose parent is actually present count — an unknown parent is
  // an orphan, which resolves to a root below.
  const parentOf = new Map<string | number, string | number>();
  for (const item of items) {
    const parentId = parentIdOf(item);
    if (parentId === null || parentId === undefined) continue;
    const id = idOf(item);
    if (parentId !== id && nodes.has(parentId)) parentOf.set(id, parentId);
  }

  const roots: N[] = [];
  for (const item of items) {
    const id = idOf(item);
    const node = nodes.get(id) as N;
    const parentId = parentOf.get(id);
    const parent = parentId === undefined ? undefined : nodes.get(parentId);

    if (parent && resolvesToRoot(id, parentOf)) parent.replies.push(node);
    else roots.push(node);
  }

  return roots;
}

/** Walk the parent chain: false if it revisits a node (a cycle). */
function resolvesToRoot(id: string | number, parentOf: Map<string | number, string | number>): boolean {
  const seen = new Set<string | number>([id]);
  let current = parentOf.get(id);
  while (current !== undefined) {
    if (seen.has(current)) return false;
    seen.add(current);
    current = parentOf.get(current);
  }
  return true;
}
