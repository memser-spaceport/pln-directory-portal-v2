/**
 * Cap a comment tree's *display* depth without dropping anything.
 *
 * This is deliberately separate from how the data arrives: the directory
 * backend allows replies at unlimited depth (`parentUid` is a plain
 * self-relation), so a component that renders whatever it's handed would indent
 * off the edge of the card. `clampDepth` is the display contract — everything
 * below `maxDepth` is lifted to `maxDepth`, in pre-order, so a reply-to-a-reply
 * shows up as a sibling of the reply it answered rather than disappearing.
 *
 * `maxDepth` is a depth *index*, matching the forum's `CommentItem.MAX_DEPTH`:
 * 2 means three rendered levels (comment → reply → reply-to-reply).
 */
export function clampDepth<N extends { replies: N[] }>(nodes: readonly N[], maxDepth: number): N[] {
  if (maxDepth <= 0) return flatten(nodes).map(asLeaf);
  return nodes.map((node) => clampNode(node, maxDepth));
}

/** `remaining` = how many more levels of nesting are allowed below `node`. */
function clampNode<N extends { replies: N[] }>(node: N, remaining: number): N {
  if (remaining <= 1) {
    // This node sits on the last level that may still have children, so every
    // descendant collapses onto one level of leaves beneath it.
    return { ...node, replies: flatten(node.replies).map(asLeaf) };
  }
  return { ...node, replies: node.replies.map((reply) => clampNode(reply, remaining - 1)) };
}

/** Pre-order: each node immediately followed by its own descendants. */
function flatten<N extends { replies: N[] }>(nodes: readonly N[]): N[] {
  const out: N[] = [];
  for (const node of nodes) {
    out.push(node);
    out.push(...flatten(node.replies));
  }
  return out;
}

function asLeaf<N extends { replies: N[] }>(node: N): N {
  return node.replies.length === 0 ? node : { ...node, replies: [] };
}
