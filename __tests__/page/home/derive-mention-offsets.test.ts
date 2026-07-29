import { deriveMentionOffsets } from '@/components/page/home/TeamNews/utils/deriveMentionOffsets';

describe('deriveMentionOffsets', () => {
  it('returns [] for no selections', () => {
    expect(deriveMentionOffsets('hello @Jane', [])).toEqual([]);
  });

  it('finds a single mention at its offset', () => {
    expect(deriveMentionOffsets('hey @Jane Doe how are you', [{ uid: 'u1', name: 'Jane Doe' }])).toEqual([
      { uid: 'u1', name: 'Jane Doe', offset: 4 },
    ]);
  });

  it('returns results sorted by offset regardless of selection order', () => {
    const text = '@Bob then @Al';
    const result = deriveMentionOffsets(text, [
      { uid: 'a', name: 'Al' },
      { uid: 'b', name: 'Bob' },
    ]);
    expect(result).toEqual([
      { uid: 'b', name: 'Bob', offset: 0 },
      { uid: 'a', name: 'Al', offset: 10 },
    ]);
  });

  it('longest name wins prefix collisions — "@Anna Lee" is not claimed by "Anna"', () => {
    const text = 'cc @Anna Lee and @Anna';
    const result = deriveMentionOffsets(text, [
      { uid: 'short', name: 'Anna' },
      { uid: 'long', name: 'Anna Lee' },
    ]);
    expect(result).toEqual([
      { uid: 'long', name: 'Anna Lee', offset: 3 },
      { uid: 'short', name: 'Anna', offset: 17 },
    ]);
  });

  it('same member selected twice claims two occurrences left-to-right', () => {
    const text = '@Sam ping @Sam';
    const result = deriveMentionOffsets(text, [
      { uid: 's', name: 'Sam' },
      { uid: 's', name: 'Sam' },
    ]);
    expect(result).toEqual([
      { uid: 's', name: 'Sam', offset: 0 },
      { uid: 's', name: 'Sam', offset: 10 },
    ]);
  });

  it('silently drops a mention whose @Name was edited away', () => {
    expect(deriveMentionOffsets('hey @Jan how are you', [{ uid: 'u1', name: 'Jane Doe' }])).toEqual([]);
  });

  it('treats regex metacharacters in names as literals', () => {
    const name = 'A.C.M.E. (staging) [*]';
    const text = `ping @${name} now`;
    expect(deriveMentionOffsets(text, [{ uid: 'acme', name }])).toEqual([{ uid: 'acme', name, offset: 5 }]);
  });

  it('offsets are UTF-16 code units — emoji before the mention count as two', () => {
    const text = '🎉 @Jo';
    // '🎉' is a surrogate pair (2 units) + space = offset 3.
    expect(deriveMentionOffsets(text, [{ uid: 'j', name: 'Jo' }])).toEqual([{ uid: 'j', name: 'Jo', offset: 3 }]);
  });

  it('a selected duplicate beyond available occurrences is dropped, not doubled', () => {
    const result = deriveMentionOffsets('@Sam once', [
      { uid: 's', name: 'Sam' },
      { uid: 's', name: 'Sam' },
    ]);
    expect(result).toEqual([{ uid: 's', name: 'Sam', offset: 0 }]);
  });
});
