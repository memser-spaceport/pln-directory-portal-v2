import { applyViewOverlay } from '@/services/team-news/applyViewOverlay';
import type { ITeamNewsItem } from '@/types/team-news.types';

const item = (uid: string, viewCount?: number): ITeamNewsItem =>
  ({ uid, title: `Headline ${uid}`, viewCount }) as ITeamNewsItem;

describe('applyViewOverlay', () => {
  it('adds the view this page load recorded', () => {
    const merged = applyViewOverlay([item('a', 7)], new Set(['a']));

    expect(merged[0].viewCount).toBe(8);
  });

  it('leaves stories nobody looked at alone', () => {
    const merged = applyViewOverlay([item('a', 7), item('b', 3)], new Set(['a']));

    expect(merged.map((i) => i.viewCount)).toEqual([8, 3]);
  });

  it('leaves an absent count absent', () => {
    // `viewCount?` is optional and ViewCount renders `count ?? 0`, so unknown
    // and zero already look alike on screen. Turning unknown into 1 would
    // assert a total the server never sent — and would read as wrong the moment
    // the real one arrives.
    const merged = applyViewOverlay([item('a')], new Set(['a']));

    expect(merged[0].viewCount).toBeUndefined();
  });

  it('gives the same answer on every render, given the same source items', () => {
    // This runs inside a useMemo that recomputes whenever anything upstream
    // changes, so the number must depend only on (source items, viewed set) —
    // never on how many times it has run.
    const source = [item('a', 7)];
    const viewed = new Set(['a']);

    expect(applyViewOverlay(source, viewed)[0].viewCount).toBe(8);
    expect(applyViewOverlay(source, viewed)[0].viewCount).toBe(8);
    expect(source[0].viewCount).toBe(7); // and the source is never mutated
  });

  it('hands back the same array when nothing has been viewed', () => {
    const items = [item('a', 7)];

    // Identity matters: this feeds useMemo chains that drive the whole feed, and
    // a fresh array before the first impression would churn them for nothing.
    expect(applyViewOverlay(items, new Set())).toBe(items);
  });

  it('ignores uids that are not on screen', () => {
    const items = [item('a', 7)];

    expect(applyViewOverlay(items, new Set(['ghost']))[0].viewCount).toBe(7);
  });
});
