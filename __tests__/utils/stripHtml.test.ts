import { stripHtml, stripHtmlPreservingBreaks } from '@/utils/forum/stripHtml';

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

describe('stripHtmlPreservingBreaks', () => {
  it('keeps a blank line between paragraphs', () => {
    expect(stripHtmlPreservingBreaks('<p>First para.</p><p>Second para.</p>')).toBe('First para.\n\nSecond para.');
  });

  it('turns <br> into a single line break', () => {
    expect(stripHtmlPreservingBreaks('<p>line one<br>line two<br/>line three</p>')).toBe(
      'line one\nline two\nline three',
    );
  });

  it('puts list items on their own lines', () => {
    expect(stripHtmlPreservingBreaks('<ul><li>one</li><li>two</li></ul><p>after</p>')).toBe('one\ntwo\n\nafter');
  });

  it('caps consecutive breaks at one blank line', () => {
    expect(stripHtmlPreservingBreaks('<p>a</p><p></p><p></p><p>b</p>')).toBe('a\n\nb');
  });

  it('collapses spaces within a line without eating the breaks', () => {
    expect(stripHtmlPreservingBreaks('<p>Hi   Protocol&nbsp;Labs </p><p> next</p>')).toBe('Hi Protocol Labs\n\nnext');
  });

  it('still decodes entities after stripping, so escaped tags stay text', () => {
    expect(stripHtmlPreservingBreaks('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')).toBe(
      '<script>alert(1)</script>',
    );
  });

  it('drops markdown images', () => {
    expect(stripHtmlPreservingBreaks('<p>Ship it ![shot](https://cdn/img.png) today</p>')).toBe('Ship it today');
  });
});
