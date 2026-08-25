import { boostReadonlyReason } from '@/services/gantry/boost';
import type { GantryItem } from '@/services/gantry/types';

const item = (overrides: Partial<GantryItem> = {}) =>
  ({
    stage: 'PLANNED',
    createdByUid: 'author-1',
    viewerHasPinned: false,
    ...overrides,
  }) as GantryItem;

describe('boostReadonlyReason', () => {
  it('lets a non-author boost a live item', () => {
    expect(boostReadonlyReason(item(), 'member-2')).toBe(false);
  });

  it("locks the control on the author's own item", () => {
    expect(boostReadonlyReason(item(), 'author-1')).toBe('author');
  });

  it('keeps the control live for an author who already self-boosted, so they can unboost', () => {
    expect(boostReadonlyReason(item({ viewerHasPinned: true }), 'author-1')).toBe(false);
  });

  it.each(['IN_PROGRESS', 'SHIPPED', 'DECLINED'] as const)('freezes %s for everyone', (stage) => {
    expect(boostReadonlyReason(item({ stage }), 'member-2')).toBe('frozen');
  });

  it('reports frozen ahead of author — the stage lock is the broader reason', () => {
    expect(boostReadonlyReason(item({ stage: 'SHIPPED' }), 'author-1')).toBe('frozen');
    // Even the already-self-boosted author, who would otherwise keep an unboost, stays frozen.
    expect(boostReadonlyReason(item({ stage: 'SHIPPED', viewerHasPinned: true }), 'author-1')).toBe('frozen');
  });

  it('treats a signed-out viewer as a non-author', () => {
    expect(boostReadonlyReason(item(), undefined)).toBe(false);
  });
});
