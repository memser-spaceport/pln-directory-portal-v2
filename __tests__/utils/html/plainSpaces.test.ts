import { plainSpaces } from '@/utils/html/plainSpaces';

describe('plainSpaces', () => {
  it('turns every form of a non-breaking space into a plain space', () => {
    expect(plainSpaces('<p>a&nbsp;b&#160;c&#xA0;d e&NBSP;f</p>')).toBe('<p>a b c d e f</p>');
  });

  it('leaves other entities alone', () => {
    expect(plainSpaces('<p>Tom &amp; Jerry &lt;3</p>')).toBe('<p>Tom &amp; Jerry &lt;3</p>');
  });
});
