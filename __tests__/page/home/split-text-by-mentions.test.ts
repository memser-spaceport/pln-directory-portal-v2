import { splitTextByMentions } from '@/components/page/home/TeamNews/utils/splitTextByMentions';

describe('splitTextByMentions', () => {
  const text = 'hey @Jane Doe welcome!';
  const jane = { uid: 'u1', name: 'Jane Doe', offset: 4 };

  it('returns one plain segment when mentions are absent or empty', () => {
    expect(splitTextByMentions(text, undefined)).toEqual([{ kind: 'text', text }]);
    expect(splitTextByMentions(text, [])).toEqual([{ kind: 'text', text }]);
  });

  it('splits around a valid mention', () => {
    expect(splitTextByMentions(text, [jane])).toEqual([
      { kind: 'text', text: 'hey ' },
      { kind: 'mention', uid: 'u1', name: 'Jane Doe', text: '@Jane Doe' },
      { kind: 'text', text: ' welcome!' },
    ]);
  });

  it('handles mentions at the very start and very end', () => {
    const t = '@Al hi @Bo';
    expect(
      splitTextByMentions(t, [
        { uid: 'a', name: 'Al', offset: 0 },
        { uid: 'b', name: 'Bo', offset: 7 },
      ]),
    ).toEqual([
      { kind: 'mention', uid: 'a', name: 'Al', text: '@Al' },
      { kind: 'text', text: ' hi ' },
      { kind: 'mention', uid: 'b', name: 'Bo', text: '@Bo' },
    ]);
  });

  it.each([
    ['offset out of bounds', [{ uid: 'u1', name: 'Jane Doe', offset: 100 }]],
    ['negative offset', [{ uid: 'u1', name: 'Jane Doe', offset: -1 }]],
    ['non-integer offset', [{ uid: 'u1', name: 'Jane Doe', offset: 4.5 }]],
    ['name mismatch at offset', [{ uid: 'u1', name: 'John Doe', offset: 4 }]],
    [
      'overlapping ranges',
      [
        { uid: 'u1', name: 'Jane Doe', offset: 4 },
        { uid: 'u2', name: 'Doe', offset: 10 },
      ],
    ],
    ['unsafe uid (path traversal)', [{ uid: '../settings', name: 'Jane Doe', offset: 4 }]],
    ['unsafe uid (query injection)', [{ uid: 'u1?x=1', name: 'Jane Doe', offset: 4 }]],
    ['empty uid', [{ uid: '', name: 'Jane Doe', offset: 4 }]],
  ])('falls back to plain text on %s', (_label, mentions) => {
    expect(splitTextByMentions(text, mentions)).toEqual([{ kind: 'text', text }]);
  });

  it('falls back to plain text on an oversized mentions array', () => {
    const many = Array.from({ length: 51 }, (_, i) => ({ uid: `u${i}`, name: 'x', offset: 0 }));
    expect(splitTextByMentions(text, many)).toEqual([{ kind: 'text', text }]);
  });

  it('never crashes on adversarial input — always returns segments covering the text', () => {
    const weird = splitTextByMentions('', [jane]);
    expect(weird).toEqual([{ kind: 'text', text: '' }]);
  });
});
