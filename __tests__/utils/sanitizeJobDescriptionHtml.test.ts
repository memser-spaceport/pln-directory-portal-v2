import { sanitizeJobDescriptionHtml } from '@/utils/html/sanitizeJobDescriptionHtml';

/**
 * The job body is the least trusted markup on the board: it is scraped from
 * whatever careers site the team happens to use, and the app ships no CSP, so
 * this allowlist is the only thing between that HTML and the page.
 *
 * The fixtures below are the two shapes that actually arrive today — Gem's
 * <br />-separated spans and a raw page fragment — not invented markup.
 */
describe('sanitizeJobDescriptionHtml', () => {
  it('keeps the formatting a real posting carries', () => {
    const html =
      '<h3>Responsibilities</h3><p><strong>bold</strong> and <em>italic</em></p><ul><li>one</li><li>two</li></ul>';

    expect(sanitizeJobDescriptionHtml(html)).toBe(html);
  });

  it('keeps a Gem-style body, whose only structure is <br>', () => {
    // No <p> anywhere — this really is how the Bluesky postings arrive.
    expect(sanitizeJobDescriptionHtml('<strong>About Us:</strong><br /><span>We build things.</span>')).toBe(
      '<strong>About Us:</strong><br><span>We build things.</span>',
    );
  });

  it('forces target/rel on the links it can honour', () => {
    expect(sanitizeJobDescriptionHtml('<a href="https://example.com/apply">Apply</a>')).toBe(
      '<a href="https://example.com/apply" target="_blank" rel="noopener noreferrer">Apply</a>',
    );
    expect(sanitizeJobDescriptionHtml('<a href="mailto:jobs@example.com">Email us</a>')).toContain(
      'href="mailto:jobs@example.com"',
    );
  });

  /**
   * The reason this config exists rather than reusing the forum post's. These
   * hrefs are relative to the team's OWN careers site; kept, they would resolve
   * against the directory and link to pages that do not exist. Dropping the
   * href and keeping the text is the honest outcome.
   */
  it('drops hrefs that would resolve against our origin, keeping the text', () => {
    expect(sanitizeJobDescriptionHtml('<a href="founder-pe">Founder PE</a>')).toBe('<a>Founder PE</a>');
    expect(sanitizeJobDescriptionHtml('<a href="#full-stack-pe">jump</a>')).toBe('<a>jump</a>');
    expect(sanitizeJobDescriptionHtml('<a href="/careers">Careers</a>')).toBe('<a>Careers</a>');
    expect(sanitizeJobDescriptionHtml('<a href="//evil.test/x">nope</a>')).toBe('<a>nope</a>');
  });

  /** A hrefless <a> opens the HealthcareAgents bodies. It must not come out
   *  wearing a target/rel it has no use for. */
  it('leaves a hrefless anchor alone', () => {
    expect(sanitizeJobDescriptionHtml('<a>Job: Founder-Level Product Engineer</a>')).toBe(
      '<a>Job: Founder-Level Product Engineer</a>',
    );
  });

  it('drops script, event handlers, and javascript: URLs', () => {
    expect(sanitizeJobDescriptionHtml('<p>hi<script>alert(1)</script></p>')).toBe('<p>hi</p>');
    expect(sanitizeJobDescriptionHtml('<p onclick="alert(1)">hi</p>')).toBe('<p>hi</p>');
    expect(sanitizeJobDescriptionHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
  });

  /** Scraped markup should not get to borrow our stylesheet or fire a
   *  third-party request from the panel. */
  it('drops style, class and images', () => {
    expect(sanitizeJobDescriptionHtml('<span style="color:red" class="theirs">x</span>')).toBe('<span>x</span>');
    expect(sanitizeJobDescriptionHtml('<img src="https://cdn.test/x.png" alt="logo" />')).toBe('');
    expect(sanitizeJobDescriptionHtml('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('survives a null or empty body', () => {
    expect(sanitizeJobDescriptionHtml('')).toBe('');
    expect(sanitizeJobDescriptionHtml(null as unknown as string)).toBe('');
  });
});
