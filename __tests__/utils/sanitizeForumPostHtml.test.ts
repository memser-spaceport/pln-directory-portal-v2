import { sanitizeForumPostHtml } from '@/utils/html/sanitizeForumPostHtml';

describe('sanitizeForumPostHtml', () => {
  it('keeps the formatting a real forum post carries', () => {
    const html = '<h2>Title</h2><p><strong>bold</strong> and <em>italic</em></p><ul><li>one</li></ul>';
    expect(sanitizeForumPostHtml(html)).toBe(html);
  });

  it('keeps images and their src/alt, dropping the inline style', () => {
    expect(sanitizeForumPostHtml('<img src="https://cdn.test/x.png" alt="shot" style="max-width:100%" />')).toBe(
      '<img alt="shot" src="https://cdn.test/x.png">',
    );
  });

  it('forces target/rel on anchors and keeps mention identity attributes', () => {
    const out = sanitizeForumPostHtml('<a class="ql-mention" data-uid="m_1" href="/members/m_1">@Jane</a>');
    expect(out).toContain('class="ql-mention"');
    expect(out).toContain('data-uid="m_1"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('drops script, event handlers, and javascript: URLs', () => {
    expect(sanitizeForumPostHtml('<p>hi<script>alert(1)</script></p>')).toBe('<p>hi</p>');
    expect(sanitizeForumPostHtml('<p onclick="alert(1)">hi</p>')).toBe('<p>hi</p>');
    expect(sanitizeForumPostHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
  });

  it('allows root-relative URLs but not protocol-relative ones', () => {
    expect(sanitizeForumPostHtml('<img src="/assets/uploads/x.png" />')).toBe('<img src="/assets/uploads/x.png">');
    expect(sanitizeForumPostHtml('<img src="//evil.test/x.png" />')).toBe('<img>');
  });
});
