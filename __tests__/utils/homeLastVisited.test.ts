import {
  getHomeLastVisitedAt,
  getHomeLastVisitedServerSnapshot,
  markHomeVisited,
  subscribeHomeLastVisited,
} from '@/utils/homeLastVisited';

const STORAGE_KEY = 'home-last-visited-at';

describe('homeLastVisited', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('returns null before any visit has been recorded', () => {
    expect(getHomeLastVisitedAt()).toBeNull();
  });

  it('records a visit and reads it back', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

    markHomeVisited();

    expect(getHomeLastVisitedAt()).toBe(1_700_000_000_000);
  });

  it('notifies subscribers so the dot clears without a reload', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeHomeLastVisited(listener);

    markHomeVisited();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    markHomeVisited();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a hand-edited string', 'yesterday'],
    ['an empty value', ''],
    ['zero', '0'],
    ['a negative number', '-5'],
  ])('reads %s as never-visited rather than a NaN that loses every comparison', (_label, raw) => {
    window.localStorage.setItem(STORAGE_KEY, raw);

    expect(getHomeLastVisitedAt()).toBeNull();
  });

  it('survives storage that throws on read', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(getHomeLastVisitedAt()).toBeNull();
  });

  it('survives storage that throws on write, and still notifies', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const listener = jest.fn();
    subscribeHomeLastVisited(listener);

    expect(() => markHomeVisited()).not.toThrow();
    expect(listener).toHaveBeenCalled();
  });

  it('has a null server snapshot — SSR cannot know, and must not hydrate a dot away', () => {
    expect(getHomeLastVisitedServerSnapshot()).toBeNull();
  });
});
