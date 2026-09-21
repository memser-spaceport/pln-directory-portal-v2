import { fitFirstRow, visibleTagCount } from '@/components/page/ai-apps/components/AiAppTagChips/fitFirstRow';

/**
 * The tag row's cut, tested as arithmetic rather than through the DOM.
 *
 * jsdom reports every `offsetTop` as 0, so a test that rendered the list and
 * asserted on what it showed would report "they all fit" however the logic
 * behaved — green, and blind to the only thing worth testing. The component
 * measures and this decides; here the measurements are given.
 */
describe('fitFirstRow', () => {
  it('counts the tags sharing the first one’s top', () => {
    expect(fitFirstRow([0, 0, 0, 26, 26])).toBe(3);
  });

  it('is every tag when nothing wrapped', () => {
    expect(fitFirstRow([0, 0, 0])).toBe(3);
  });

  it('is nothing when there is nothing', () => {
    expect(fitFirstRow([])).toBe(0);
  });

  /* Sub-pixel rounding in a flex row: two tags on the same line can differ by a
     fraction at some zoom levels, and treating that as a wrap would cut a row
     that never wrapped. */
  it('tolerates a sub-pixel difference on the same line', () => {
    expect(fitFirstRow([0, 0.5, 0.75, 26])).toBe(3);
  });

  /* The row stops at the FIRST wrap, not at every tag that happens to share a
     top: a third row can align with the first when rows differ in height. */
  it('stops at the first wrap rather than matching later rows', () => {
    expect(fitFirstRow([0, 0, 26, 0])).toBe(2);
  });
});

describe('visibleTagCount', () => {
  /**
   * The counter takes room from the row it describes. Four of five fitting means
   * showing three: "+2" needs the width the fourth was using, and without this
   * the counter lands on a second row — which is the bug the cut exists to
   * remove, reintroduced by the cut itself.
   */
  it('gives up a tag to make room for the counter', () => {
    expect(visibleTagCount([0, 0, 0, 0, 26], 5)).toBe(3);
  });

  /* No counter, so nothing has to make room for one. */
  it('shows everything when everything fits', () => {
    expect(visibleTagCount([0, 0, 0], 3)).toBe(3);
  });

  /**
   * One tag always survives. A row reading only "+5" tells the reader the card
   * has tags and names none of them — reachable whenever the first tag is wider
   * than the card, which the longer category names are on a narrow grid.
   */
  it('keeps one tag even when the first one alone overflows', () => {
    expect(visibleTagCount([0, 26, 26], 3)).toBe(1);
  });
});
