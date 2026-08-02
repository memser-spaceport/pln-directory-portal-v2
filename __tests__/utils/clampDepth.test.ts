import { clampDepth } from '@/utils/comments/clampDepth';

interface Node {
  id: string;
  replies: Node[];
}

function node(id: string, replies: Node[] = []): Node {
  return { id, replies };
}

/** Depth of every node, keyed by id — the thing the display cap is about. */
function depths(nodes: Node[], depth = 0, out: Record<string, number> = {}): Record<string, number> {
  for (const n of nodes) {
    out[n.id] = depth;
    depths(n.replies, depth + 1, out);
  }
  return out;
}

function ids(nodes: Node[]): string[] {
  return nodes.flatMap((n) => [n.id, ...ids(n.replies)]);
}

describe('clampDepth', () => {
  it('leaves a tree that already fits untouched', () => {
    const tree = [node('a', [node('b', [node('c')])])];

    expect(depths(clampDepth(tree, 2))).toEqual({ a: 0, b: 1, c: 2 });
  });

  it('lifts a depth-3 reply to depth 2, as a sibling of the reply it answered', () => {
    const tree = [node('a', [node('b', [node('c', [node('d')])])])];

    const clamped = clampDepth(tree, 2);

    expect(depths(clamped)).toEqual({ a: 0, b: 1, c: 2, d: 2 });
    expect(clamped[0].replies[0].replies.map((n) => n.id)).toEqual(['c', 'd']);
  });

  it('collapses an arbitrarily deep chain onto the cap, keeping every comment', () => {
    // a > b > c > d > e > f — the backend permits this; the card cannot show it.
    const deep = [node('a', [node('b', [node('c', [node('d', [node('e', [node('f')])])])])])];

    const clamped = clampDepth(deep, 2);

    expect(ids(clamped).sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(depths(clamped)).toEqual({ a: 0, b: 1, c: 2, d: 2, e: 2, f: 2 });
  });

  it('flattens descendants in pre-order, so a reply follows the comment it answered', () => {
    const tree = [node('a', [node('b', [node('b1', [node('b1a')]), node('b2')]), node('c', [node('c1')])])];

    const clamped = clampDepth(tree, 2);

    expect(clamped[0].replies.map((n) => n.id)).toEqual(['b', 'c']);
    expect(clamped[0].replies[0].replies.map((n) => n.id)).toEqual(['b1', 'b1a', 'b2']);
    expect(clamped[0].replies[1].replies.map((n) => n.id)).toEqual(['c1']);
  });

  it('flattens everything to one level at maxDepth 0', () => {
    const tree = [node('a', [node('b', [node('c')])]), node('d')];

    const clamped = clampDepth(tree, 0);

    expect(clamped.map((n) => n.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(clamped.every((n) => n.replies.length === 0)).toBe(true);
  });

  it('allows two levels at maxDepth 1', () => {
    const tree = [node('a', [node('b', [node('c')])])];

    expect(depths(clampDepth(tree, 1))).toEqual({ a: 0, b: 1, c: 1 });
  });

  it('does not mutate the input tree', () => {
    const grandchild = node('c', [node('d')]);
    const tree = [node('a', [node('b', [grandchild])])];

    clampDepth(tree, 2);

    expect(grandchild.replies.map((n) => n.id)).toEqual(['d']);
    expect(depths(tree)).toEqual({ a: 0, b: 1, c: 2, d: 3 });
  });

  it('returns an empty list for an empty tree', () => {
    expect(clampDepth([], 2)).toEqual([]);
  });
});
