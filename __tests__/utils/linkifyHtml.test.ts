import { linkifyHtml } from '@/utils/html';

describe('linkifyHtml', () => {
  it('wraps a bare URL in an anchor', () => {
    expect(linkifyHtml('see https://example.com now')).toBe(
      'see <a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a> now',
    );
  });

  it('leaves trailing sentence punctuation out of the href', () => {
    expect(linkifyHtml('see https://example.com.')).toContain('href="https://example.com"');
    expect(linkifyHtml('see https://example.com.')).toMatch(/<\/a>\.$/);
  });

  it('leaves a URL that is already anchored alone', () => {
    const already = '<a href="https://example.com">https://example.com</a>';
    expect(linkifyHtml(already)).toBe(already);
  });

  it('leaves URLs inside tag attributes alone', () => {
    const markup = '<img src="https://example.com/a.png">';
    expect(linkifyHtml(markup)).toBe(markup);
  });

  it('escapes a URL that would otherwise break out of the href attribute', () => {
    // URL_REGEX matches everything up to whitespace, `"` included. QuillContent
    // renders this function's output with NO sanitizer, so escaping here is the
    // only thing standing between a crafted URL and an event handler.
    const out = linkifyHtml('https://x.test/"onmouseover="alert(1)');

    expect(out).not.toContain('onmouseover="alert(1)"');
    expect(out).toContain('&quot;');
  });

  it('escapes angle brackets in the link text', () => {
    const out = linkifyHtml('https://x.test/a&b');

    expect(out).toContain('&amp;');
    expect(out).not.toMatch(/href="[^"]*&(?!amp;)/);
  });
});
