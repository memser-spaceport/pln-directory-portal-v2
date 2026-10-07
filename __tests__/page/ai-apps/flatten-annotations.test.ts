import { wrapLabelLines } from '@/components/page/ai-apps/components/screenshot-feedback/flattenAnnotations';

// Every character 10px wide, so a 100px line holds ten.
const measure = (text: string) => text.length * 10;

describe('wrapLabelLines — a label drawn into the picture wraps as `.label` does', () => {
  it('keeps a short label on one line', () => {
    expect(wrapLabelLines('Too small', 100, measure)).toEqual(['Too small']);
  });

  it('breaks between words, never inside one that fits', () => {
    expect(wrapLabelLines('This button is hard to find', 100, measure)).toEqual([
      'This',
      'button is',
      'hard to',
      'find',
    ]);
  });

  it('keeps the author’s own line breaks, blank lines included', () => {
    expect(wrapLabelLines('One\n\nTwo', 100, measure)).toEqual(['One', '', 'Two']);
  });

  it('breaks a word wider than the whole line between characters', () => {
    expect(wrapLabelLines('abcdefghijklmnopqrstuvwxy', 100, measure)).toEqual(['abcdefghij', 'klmnopqrst', 'uvwxy']);
  });

  it('does not carry the space that ended a line onto the next', () => {
    expect(wrapLabelLines('aaaaaaaaaa bbb', 100, measure)).toEqual(['aaaaaaaaaa', 'bbb']);
  });
});
