import { resolveBestPath, resolveBestConnector } from '@/services/investors/pathfinder.service';
import type { PathContact, PathOrgConnector, PathfinderPath } from '@/services/investors/types';

function path(overrides: Partial<PathfinderPath>): PathfinderPath {
  return {
    id: 1,
    target_investor_id: 'inv-1',
    connector_type: 'F',
    hops: 1,
    caliber: 'A',
    proximity_code: 'F+1A',
    score: 0.5,
    caliber_confidence: 0.9,
    hop_chain: { nodes: [], edges: [], explanation: '' },
    rank: 1,
    corrections: [],
    ...overrides,
  };
}

const contact: PathContact = { name: 'Alicia Mer', member_uid: 'alicia-mer' };
const org: PathOrgConnector = { name: 'Pico Ventures' };

describe('resolveBestPath', () => {
  it('returns null for an empty list', () => {
    expect(resolveBestPath([])).toBeNull();
  });

  it('prefers the path with rank === 1, regardless of array order', () => {
    const best = path({ id: 10, rank: 1, score: 0.4 });
    const paths = [path({ id: 20, rank: 2, score: 0.9 }), best, path({ id: 30, rank: 3 })];
    expect(resolveBestPath(paths)?.id).toBe(10);
  });

  it('falls back to highest score, then fewest hops, when no rank-1 exists', () => {
    const paths = [
      path({ id: 1, rank: 2, score: 0.6, hops: 2 }),
      path({ id: 2, rank: 3, score: 0.8, hops: 3 }),
      path({ id: 3, rank: 3, score: 0.8, hops: 1 }), // same score, fewer hops → wins
    ];
    expect(resolveBestPath(paths)?.id).toBe(3);
  });

  it('does not mutate the input array', () => {
    const paths = [path({ id: 1, rank: 2, score: 0.2 }), path({ id: 2, rank: 3, score: 0.9 })];
    const order = paths.map((p) => p.id);
    resolveBestPath(paths);
    expect(paths.map((p) => p.id)).toEqual(order);
  });

  it('treats a non-finite score as lowest in the tiebreak', () => {
    const paths = [
      path({ id: 1, rank: 5, score: NaN, hops: 1 }),
      path({ id: 2, rank: 6, score: 0.1, hops: 3 }),
    ];
    expect(resolveBestPath(paths)?.id).toBe(2);
  });
});

describe('resolveBestConnector', () => {
  it('returns kind "none" for a null path', () => {
    expect(resolveBestConnector(null)).toEqual({ kind: 'none' });
  });

  it('prefers a known contact (person) over an org connector', () => {
    expect(resolveBestConnector(path({ contact, org_connector: org }))).toEqual({ kind: 'contact', contact });
  });

  it('falls back to the org connector when no contact is known', () => {
    expect(resolveBestConnector(path({ org_connector: org }))).toEqual({ kind: 'org', org });
  });

  it('returns kind "none" when neither contact nor org is present', () => {
    expect(resolveBestConnector(path({}))).toEqual({ kind: 'none' });
  });
});
