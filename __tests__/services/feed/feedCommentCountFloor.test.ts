import { readCountFloors, writeCountFloor } from '@/services/feed/feedCommentCountFloor';

const STORAGE_KEY = 'feed.commentCountFloor.v1';

describe('feedCommentCountFloor', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('remembers a count across reads', () => {
    writeCountFloor('fp_96', 4);

    expect(readCountFloors()).toEqual({ fp_96: 4 });
  });

  it('REPLACES rather than raises, so a deletion can bring the count back down', () => {
    writeCountFloor('fp_96', 4);
    writeCountFloor('fp_96', 2);

    expect(readCountFloors()).toEqual({ fp_96: 2 });
  });

  it('ignores news uids — their counts are server-authoritative', () => {
    writeCountFloor('news-1', 5);

    expect(readCountFloors()).toEqual({});
  });

  it('drops a news uid that reached storage some other way', () => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ fp_96: 3, 'news-1': 9 }));

    expect(readCountFloors()).toEqual({ fp_96: 3 });
  });

  it.each([
    ['malformed json', '{not json'],
    ['an array', '[1,2,3]'],
    ['a bare string', '"hello"'],
    ['null', 'null'],
  ])('returns {} for %s rather than throwing', (_label, raw) => {
    window.sessionStorage.setItem(STORAGE_KEY, raw);

    expect(readCountFloors()).toEqual({});
  });

  it('drops values that are not usable counts, keeping the rest', () => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ fp_1: 'three', fp_2: -1, fp_3: null, fp_4: 2 }));

    expect(readCountFloors()).toEqual({ fp_4: 2 });
  });

  it.each([
    ['NaN', NaN],
    ['negative', -2],
  ])('refuses to write %s', (_label, count) => {
    writeCountFloor('fp_96', count);

    expect(readCountFloors()).toEqual({});
  });

  it('survives storage that throws on read', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(readCountFloors()).toEqual({});
  });

  it('survives storage that throws on write', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => writeCountFloor('fp_96', 4)).not.toThrow();
  });

  it('trims to the 200 most recently written uids', () => {
    for (let i = 0; i < 205; i += 1) writeCountFloor(`fp_${i}`, i);

    const floors = readCountFloors();

    expect(Object.keys(floors)).toHaveLength(200);
    // The five oldest are gone; the newest survived.
    expect(floors.fp_0).toBeUndefined();
    expect(floors.fp_4).toBeUndefined();
    expect(floors.fp_5).toBe(5);
    expect(floors.fp_204).toBe(204);
  });

  it('re-writing an old uid keeps it from being trimmed away', () => {
    for (let i = 0; i < 200; i += 1) writeCountFloor(`fp_${i}`, i);
    writeCountFloor('fp_0', 42);
    writeCountFloor('fp_900', 1);

    const floors = readCountFloors();

    expect(floors.fp_0).toBe(42);
    // fp_1 was the least recently written once fp_0 moved to the end.
    expect(floors.fp_1).toBeUndefined();
  });
});
