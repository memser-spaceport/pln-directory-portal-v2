import { autosizeTextarea } from '@/prototypes/entries/job-board/components/ReferModal/hooks/useAutosizeTextarea';

/**
 * Tested against a fake element rather than through the modal.
 *
 * jsdom reports `scrollHeight: 0` for every element it lays out, so a DOM test
 * could only ever assert `height: '0px'` — which an empty function would satisfy
 * just as well. A fake makes `scrollHeight` a value we choose, and makes the
 * order of the two writes observable, which is the part that carries the
 * behaviour.
 */
function fakeTextarea(scrollHeight: number, initialHeight = '') {
  const writes: string[] = [];
  const style = {
    get height() {
      return writes[writes.length - 1] ?? initialHeight;
    },
    set height(v: string) {
      writes.push(v);
    },
  };
  return { el: { style, scrollHeight } as never, writes };
}

describe('autosizeTextarea', () => {
  it('sets the height to the content height', () => {
    const { el, writes } = fakeTextarea(320);

    autosizeTextarea(el);

    expect(writes[writes.length - 1]).toBe('320px');
  });

  /* The reset is the only reason the box can ever shrink: scrollHeight never
     reports less than the element's current height, so measuring without it would
     ratchet the note up to its longest-ever length and leave it there once the
     text was deleted. Asserting the *order* is what proves the reset happens
     before the measurement, not after it. */
  it('clears the height before measuring, so the box can shrink', () => {
    const { el, writes } = fakeTextarea(120, '900px');

    autosizeTextarea(el);

    expect(writes).toEqual(['auto', '120px']);
  });

  it('is idempotent — re-running on an unchanged element changes nothing', () => {
    const { el, writes } = fakeTextarea(240);

    autosizeTextarea(el);
    autosizeTextarea(el);

    expect(writes).toEqual(['auto', '240px', 'auto', '240px']);
  });
});
