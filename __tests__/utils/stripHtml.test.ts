import { stripHtml } from '@/utils/forum/stripHtml';

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hi  Protocol   Labs</p>')).toBe('Hi Protocol Labs');
  });

  it('drops markdown images', () => {
    expect(stripHtml('<p>Ship it ![screenshot](https://cdn/img.png) today</p>')).toBe('Ship it today');
  });

  it('decodes the entities NodeBB escapes on the way in', () => {
    expect(stripHtml('<p>a &lt; b &amp;&amp; c &gt; d</p>')).toBe('a < b && c > d');
    expect(stripHtml('<p>&quot;quoted&quot; and &#39;single&#39;</p>')).toBe('"quoted" and \'single\'');
    expect(stripHtml('<p>it&apos;s fine</p>')).toBe("it's fine");
  });

  it('decodes &amp; last, so a doubly-escaped entity stays text', () => {
    // `&amp;lt;` is the escaped form of the literal text `&lt;` — decoding
    // `&amp;` first would turn it into `&lt;` and then into a `<`.
    expect(stripHtml('<p>&amp;lt;script&amp;gt;</p>')).toBe('&lt;script&gt;');
  });

  it('never turns an escaped tag back into markup', () => {
    expect(stripHtml('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('<script>alert(1)</script>');
  });

  it('turns &nbsp; into a plain space', () => {
    expect(stripHtml('<p>one&nbsp;two</p>')).toBe('one two');
  });

  it('returns an empty string for empty or tag-only content', () => {
    expect(stripHtml('')).toBe('');
    expect(stripHtml('<p></p>')).toBe('');
  });
});
