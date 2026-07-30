import { buildCommentTree } from '@/utils/comments/buildCommentTree';

interface Flat {
  id: string;
  parentId: string | null;
}

interface Node {
  id: string;
  replies: Node[];
}

/** Shape the feed and the forum both pass in: id/parent accessors + a node factory. */
function build(items: Flat[]): Node[] {
  return buildCommentTree<Flat, Node>({
    items,
    idOf: (item) => item.id,
    parentIdOf: (item) => item.parentId,
    makeNode: (item) => ({ id: item.id, replies: [] }),
  });
}

/** Every id in the tree, so "nothing disappears" can be asserted directly. */
function ids(nodes: Node[]): string[] {
  return nodes.flatMap((node) => [node.id, ...ids(node.replies)]);
}

describe('buildCommentTree', () => {
  it('nests replies under their parent and leaves roots at the top', () => {
    const tree = build([
      { id: 'a', parentId: null },
      { id: 'b', parentId: 'a' },
      { id: 'c', parentId: null },
    ]);

    expect(tree.map((n) => n.id)).toEqual(['a', 'c']);
    expect(tree[0].replies.map((n) => n.id)).toEqual(['b']);
  });

  it('nests to unlimited depth (the backend allows it; capping is clampDepth’s job)', () => {
    const tree = build([
      { id: 'a', parentId: null },
      { id: 'b', parentId: 'a' },
      { id: 'c', parentId: 'b' },
      { id: 'd', parentId: 'c' },
    ]);

    expect(tree[0].replies[0].replies[0].replies[0].id).toBe('d');
  });

  it('preserves input order at every level (oldest-first in, oldest-first out)', () => {
    const tree = build([
      { id: 'a', parentId: null },
      { id: 'r1', parentId: 'a' },
      { id: 'r2', parentId: 'a' },
      { id: 'r3', parentId: 'a' },
    ]);

    expect(tree[0].replies.map((n) => n.id)).toEqual(['r1', 'r2', 'r3']);
  });

  it('promotes an orphan to a root rather than dropping it', () => {
    // 'b' answers a comment that is not in this page of results.
    const tree = build([
      { id: 'a', parentId: null },
      { id: 'b', parentId: 'missing' },
    ]);

    expect(tree.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('promotes a self-parenting comment to a root', () => {
    const tree = build([{ id: 'a', parentId: 'a' }]);

    expect(tree.map((n) => n.id)).toEqual(['a']);
    expect(tree[0].replies).toEqual([]);
  });

  it('breaks a parent cycle instead of building one — an attached cycle would infinitely recurse the renderer', () => {
    const tree = build([
      { id: 'a', parentId: 'b' },
      { id: 'b', parentId: 'a' },
    ]);

    expect(tree.map((n) => n.id)).toEqual(['a', 'b']);
    expect(tree.every((n) => n.replies.length === 0)).toBe(true);
  });

  it('keeps every item when a cycle sits above a longer chain', () => {
    const tree = build([
      { id: 'a', parentId: 'c' },
      { id: 'b', parentId: 'a' },
      { id: 'c', parentId: 'b' },
      { id: 'd', parentId: null },
    ]);

    expect(ids(tree).sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('returns an empty tree for an empty list', () => {
    expect(build([])).toEqual([]);
  });

  it('works with numeric ids (NodeBB pids)', () => {
    interface PidNode {
      pid: number;
      replies: PidNode[];
    }

    const tree = buildCommentTree<{ pid: number; parent?: { pid: number } }, PidNode>({
      items: [{ pid: 263 }, { pid: 264, parent: { pid: 263 } }],
      idOf: (item) => item.pid,
      parentIdOf: (item) => item.parent?.pid,
      makeNode: (item) => ({ pid: item.pid, replies: [] }),
    });

    expect(tree).toHaveLength(1);
    expect(tree[0].pid).toBe(263);
    expect(tree[0].replies).toHaveLength(1);
  });
});
