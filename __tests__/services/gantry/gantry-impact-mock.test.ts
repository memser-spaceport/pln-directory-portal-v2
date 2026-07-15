/**
 * The mock store is module-level state; jest.isolateModules gives each test a fresh copy
 * so seeding/mutations don't leak between cases.
 */
import type { GantryItem, GantryItemListResponse, GantryPinStatus } from '@/services/gantry/types';

type MockModule = typeof import('@/services/gantry/gantry-impact.mock-data');

function loadMock(): MockModule {
  let mod: MockModule;
  jest.isolateModules(() => {
    mod = require('@/services/gantry/gantry-impact.mock-data');
  });
  return mod!;
}

const item = (uid: string, overrides: Partial<GantryItem> = {}): GantryItem =>
  ({
    uid,
    title: uid,
    pinCount: 0,
    viewerHasPinned: false,
    viewerPinNote: null,
    authorImpact: null,
    authorImpactReasoning: null,
    avgImpact: null,
    impactCount: 0,
    impactDistribution: null,
    viewerImpact: null,
    ...overrides,
  }) as GantryItem;

const listOf = (...items: GantryItem[]): GantryItemListResponse => ({ items, total: items.length });

describe('gantry impact mock store', () => {
  it('seeds the first N real items positionally and leaves the rest as legacy', () => {
    const mock = loadMock();
    const uids = Array.from({ length: 8 }, (_, i) => `real-${i}`);

    const decorated = mock.decorateItems(listOf(...uids.map((uid) => item(uid)))).items;

    decorated.slice(0, 6).forEach((it) => {
      expect(it.impactCount).toBeGreaterThan(0);
      expect(it.avgImpact).not.toBeNull();
      expect(it.authorImpact).not.toBeNull();
    });
    decorated.slice(6).forEach((it) => {
      expect(it.impactCount).toBe(0);
      expect(it.avgImpact).toBeNull();
    });
  });

  it('seeds only once — a second list call keeps the same assignment', () => {
    const mock = loadMock();
    const first = mock.decorateItems(listOf(item('a'), item('b'))).items;
    const second = mock.decorateItems(listOf(item('c'), item('a'))).items;

    const a1 = first.find((it) => it.uid === 'a')!;
    const a2 = second.find((it) => it.uid === 'a')!;
    const c = second.find((it) => it.uid === 'c')!;

    expect(a2.impactCount).toBe(a1.impactCount);
    expect(a2.avgImpact).toBe(a1.avgImpact);
    expect(c.impactCount).toBe(0);
  });

  it('mutations survive the refetch-after-invalidate round trip (stateful, not fixture)', () => {
    const mock = loadMock();
    mock.decorateItems(listOf(item('legacy-item'), item('x'), item('y'), item('z'), item('w'), item('v'), item('u')));

    const before = mock.decorateItem(item('u'))!;
    expect(before.impactCount).toBe(0);

    mock.recordPinImpact('u', 5, 'why now');
    const after = mock.decorateItem(item('u'))!;
    expect(after.impactCount).toBe(1);
    expect(after.avgImpact).toBe(5);
    expect(after.viewerImpact).toBe(5);
    expect(after.viewerPinNote).toBe('why now');

    mock.updatePinImpact('u', { impact: 2 });
    expect(mock.decorateItem(item('u'))!.avgImpact).toBe(2);

    mock.removePinImpact('u');
    const removed = mock.decorateItem(item('u'))!;
    expect(removed.impactCount).toBe(0);
    expect(removed.viewerImpact).toBeNull();
  });

  it('author impact is independent of pin impact removal', () => {
    const mock = loadMock();
    mock.recordAuthorImpact('mine', 4, 'ships the goal');
    mock.recordPinImpact('mine', 5);

    mock.removePinImpact('mine');

    const decorated = mock.decorateItem(item('mine'))!;
    expect(decorated.authorImpact).toBe(4);
    expect(decorated.authorImpactReasoning).toBe('ships the goal');
    expect(decorated.impactCount).toBe(1);
    expect(decorated.avgImpact).toBe(4);
    expect(decorated.viewerImpact).toBeNull();
  });

  it('overrides the pin limit to 10 and recomputes remaining from real used', () => {
    const mock = loadMock();
    const status: GantryPinStatus = { limit: 6, used: 4, remaining: 2, pins: [] };

    expect(mock.decoratePinStatus(status)).toEqual({ limit: 10, used: 4, remaining: 6, pins: [] });
  });
});
