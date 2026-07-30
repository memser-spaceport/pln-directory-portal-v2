import { insertCommentIntoTree, removeCommentFromTree } from '@/utils/comments/mutateCommentTree';

interface Node {
  uid: string;
  parentUid: string | null;
  replies: Node[];
}

function node(uid: string, parentUid: string | null = null, replies: Node[] = []): Node {
  return { uid, parentUid, replies };
}

function ids(nodes: Node[]): string[] {
  return nodes.flatMap((n) => [n.uid, ...ids(n.replies)]);
}

describe('insertCommentIntoTree', () => {
  it('appends a top-level comment at the end (threads are oldest-first)', () => {
    const tree = [node('a'), node('b')];

    expect(insertCommentIntoTree(tree, node('c')).map((n) => n.uid)).toEqual(['a', 'b', 'c']);
  });

  it('appends a reply under its parent, not at the root', () => {
    const tree = [node('a', null, [node('a1', 'a')]), node('b')];

    const next = insertCommentIntoTree(tree, node('a2', 'a'));

    expect(next.map((n) => n.uid)).toEqual(['a', 'b']);
    expect(next[0].replies.map((n) => n.uid)).toEqual(['a1', 'a2']);
  });

  it('finds a parent nested several levels down', () => {
    const tree = [node('a', null, [node('b', 'a', [node('c', 'b')])])];

    const next = insertCommentIntoTree(tree, node('d', 'c'));

    expect(next[0].replies[0].replies[0].replies.map((n) => n.uid)).toEqual(['d']);
  });

  it('falls back to the root when the parent is not in the tree, rather than dropping the comment', () => {
    const tree = [node('a')];

    const next = insertCommentIntoTree(tree, node('x', 'gone'));

    expect(next.map((n) => n.uid)).toEqual(['a', 'x']);
  });

  it('inserts into an empty tree', () => {
    expect(insertCommentIntoTree([], node('a')).map((n) => n.uid)).toEqual(['a']);
  });

  it('does not mutate the input tree', () => {
    const parent = node('a', null, [node('a1', 'a')]);
    const tree = [parent];

    insertCommentIntoTree(tree, node('a2', 'a'));

    expect(parent.replies.map((n) => n.uid)).toEqual(['a1']);
  });

  it('leaves sibling branches untouched by identity (no needless re-render)', () => {
    const untouched = node('b', null, [node('b1', 'b')]);
    const tree = [node('a'), untouched];

    const next = insertCommentIntoTree(tree, node('a1', 'a'));

    expect(next[1]).toBe(untouched);
  });
});

describe('removeCommentFromTree', () => {
  it('removes a top-level comment and counts it once', () => {
    const tree = [node('a'), node('b')];

    const { items, removedCount } = removeCommentFromTree(tree, 'a');

    expect(items.map((n) => n.uid)).toEqual(['b']);
    expect(removedCount).toBe(1);
  });

  it('removes a nested reply', () => {
    const tree = [node('a', null, [node('a1', 'a'), node('a2', 'a')])];

    const { items, removedCount } = removeCommentFromTree(tree, 'a1');

    expect(items[0].replies.map((n) => n.uid)).toEqual(['a2']);
    expect(removedCount).toBe(1);
  });

  it('counts the whole subtree — the backend cascades, so the badge must drop by more than 1', () => {
    const tree = [node('a', null, [node('a1', 'a', [node('a1a', 'a1'), node('a1b', 'a1')]), node('a2', 'a')])];

    const { items, removedCount } = removeCommentFromTree(tree, 'a1');

    expect(removedCount).toBe(3);
    expect(ids(items)).toEqual(['a', 'a2']);
  });

  it('counts an entire thread when its root is deleted', () => {
    const tree = [node('a', null, [node('a1', 'a', [node('a1a', 'a1')])]), node('b')];

    const { items, removedCount } = removeCommentFromTree(tree, 'a');

    expect(removedCount).toBe(3);
    expect(items.map((n) => n.uid)).toEqual(['b']);
  });

  it('reports 0 for a comment that is not in the tree, so a stale delete cannot move the count', () => {
    const tree = [node('a', null, [node('a1', 'a')])];

    const { items, removedCount } = removeCommentFromTree(tree, 'gone');

    expect(removedCount).toBe(0);
    expect(ids(items)).toEqual(['a', 'a1']);
  });

  it('does not mutate the input tree', () => {
    const parent = node('a', null, [node('a1', 'a')]);

    removeCommentFromTree([parent], 'a1');

    expect(parent.replies.map((n) => n.uid)).toEqual(['a1']);
  });
});
