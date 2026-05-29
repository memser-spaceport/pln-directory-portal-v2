import { buildForumPrefillContent } from '@/components/page/forum/CreatePost/helpers';

describe('buildForumPrefillContent', () => {
  it('returns empty string when no URL is provided', () => {
    expect(buildForumPrefillContent('hello', '')).toBe('');
  });

  it('builds an http(s) anchor link with the title as link text', () => {
    const out = buildForumPrefillContent('Cool article', 'https://example.com/post');
    expect(out).toContain('<a href="https://example.com/post"');
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('Cool article');
  });

  it('falls back to the URL as link text when no title is provided', () => {
    const out = buildForumPrefillContent('', 'https://example.com/post');
    expect(out).toContain('>https://example.com/post</a>');
  });

  describe('XSS hardening', () => {
    it('drops javascript: URLs entirely (no link emitted)', () => {
      expect(buildForumPrefillContent('Click here', 'javascript:alert(1)')).toBe('');
    });

    it('drops data: URLs entirely', () => {
      expect(buildForumPrefillContent('Click here', 'data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('drops vbscript: URLs entirely', () => {
      expect(buildForumPrefillContent('Click here', 'vbscript:msgbox(1)')).toBe('');
    });

    it('drops relative URLs entirely', () => {
      expect(buildForumPrefillContent('Click here', '/internal/path')).toBe('');
    });

    it('escapes < > " \' & in the title so it cannot break out of the link text', () => {
      const out = buildForumPrefillContent('<script>alert(1)</script>', 'https://example.com/');
      expect(out).not.toContain('<script>');
      expect(out).toContain('&lt;script&gt;');
    });

    it('encodes double-quote attack via encodeURI (cannot break out of double-quoted href)', () => {
      const malicious = 'https://example.com/" onclick="alert(1)';
      const out = buildForumPrefillContent('Title', malicious);
      // " is percent-encoded by encodeURI to %22, so the attack payload is
      // inert as href content — no second attribute appears.
      expect(out).not.toMatch(/href="https:\/\/example\.com\/"[^>]*onclick/);
      expect(out).toContain('%22');
    });

    it('escapes embedded single quotes in the URL (encodeURI does not encode them)', () => {
      // encodeURI leaves `'` untouched, so we rely on escapeHtml to convert
      // it to &#39; — otherwise an attacker could close a single-quoted
      // attribute and inject an event handler. The literal word
      // "onmouseover" can still appear inside the href value (harmless when
      // the quote is escaped), but no second attribute is produced.
      const malicious = "https://example.com/' onmouseover='alert(1)";
      const out = buildForumPrefillContent('Title', malicious);
      expect(out).toContain('&#39;');
      // Crucially: there is exactly one attribute (href) inside the <a> tag —
      // i.e. no whitespace + `onmouseover=` outside of the encoded href value.
      expect(out).not.toMatch(/<a[^>]*\s+onmouseover\s*=/);
    });
  });
});
