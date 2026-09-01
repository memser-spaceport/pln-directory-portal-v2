import { normalizeJobDescriptionHtml } from '@/utils/html/normalizeJobDescriptionHtml';
import { sanitizeJobDescriptionHtml } from '@/utils/html/sanitizeJobDescriptionHtml';

/**
 * The repair pass for one ingest's half-run markdown converter.
 *
 * Fixtures are slices of real postings wherever the defect exists in the live
 * corpus — every markdown link, every `&amp;amp;` and every split list below
 * came off `jobs.polychain.capital`, Protocol Labs' own board. The invented
 * markup is confined to the cases the corpus does not contain but a converter
 * could plausibly emit, which is where the safety properties live.
 *
 * The last two describes are the ones worth guarding hardest: this function
 * emits markup, so if it is ever reordered to run AFTER the sanitizer, or its
 * entity pattern is loosened, it stops being a repair and becomes a hole.
 */
describe('normalizeJobDescriptionHtml', () => {
  describe('double-escaped entities', () => {
    it('decodes the &amp;amp; that reads as a literal &amp; on screen', () => {
      // Verbatim from the CMO posting, which carries seven of these.
      expect(normalizeJobDescriptionHtml('<p><strong>Ecosystem Growth &amp;amp; Network Effects</strong></p>')).toBe(
        '<p><strong>Ecosystem Growth &amp; Network Effects</strong></p>',
      );
    });

    it('handles named and numeric entities alike', () => {
      // &amp;nbsp; is the Recall Network posting, the one non-&amp;amp; case.
      expect(normalizeJobDescriptionHtml('<p>a&amp;nbsp;b</p>')).toBe('<p>a&nbsp;b</p>');
      expect(normalizeJobDescriptionHtml('<p>&amp;#8212; &amp;#x2014;</p>')).toBe('<p>&#8212; &#x2014;</p>');
    });

    /**
     * Exactly one layer. Peeling until nothing is left would eventually hand the
     * page a raw character, which is the whole failure mode this pattern exists
     * to avoid.
     */
    it('peels one layer and stops', () => {
      expect(normalizeJobDescriptionHtml('<p>a &amp;amp;amp; b</p>')).toBe('<p>a &amp;amp; b</p>');
    });

    /** A `&amp;` that is correctly escaped ONCE is real content and stays. */
    it('leaves a correctly escaped ampersand alone', () => {
      expect(normalizeJobDescriptionHtml('<p>Ben &amp; Jerry</p>')).toBe('<p>Ben &amp; Jerry</p>');
    });
  });

  describe('entity-encoded bodies (Greenhouse content)', () => {
    it('unwraps a fully encoded posting into real tags', () => {
      expect(
        normalizeJobDescriptionHtml(
          '&lt;div class=&quot;content-intro&quot;&gt;&lt;p&gt;We are on a mission&lt;/p&gt;&lt;/div&gt;',
        ),
      ).toBe('<div class="content-intro"><p>We are on a mission</p></div>');
    });

    it('unwraps the stored shape, whose quotes are already real', () => {
      expect(normalizeJobDescriptionHtml('&lt;div class="content-intro"&gt;&lt;p&gt;Hi&lt;/p&gt;&lt;/div&gt;')).toBe(
        '<div class="content-intro"><p>Hi</p></div>',
      );
    });

    it('does not turn &lt; into a tag inside a well-formed body', () => {
      expect(normalizeJobDescriptionHtml('<p>use x &lt; 5</p>')).toBe('<p>use x &lt; 5</p>');
    });
  });

  describe('markdown links the converter left as text', () => {
    it('turns them into anchors that open away from the drawer', () => {
      expect(normalizeJobDescriptionHtml('<p>[Protocol Labs](https://protocol.ai/) is a network</p>')).toBe(
        '<p><a href="https://protocol.ai/" target="_blank" rel="noopener noreferrer">Protocol Labs</a> is a network</p>',
      );
    });

    /** A real one from the CMO posting. The label has parens; the URL does not,
     *  which is exactly why the label is bounded by `]` and the URL by `)`. */
    it('keeps parentheses that belong to the label', () => {
      expect(
        normalizeJobDescriptionHtml(
          '[2024 PL Summit Video (Remote Update)](https://www.youtube.com/watch?v=N9lQx9ijv88)',
        ),
      ).toBe(
        '<a href="https://www.youtube.com/watch?v=N9lQx9ijv88" target="_blank" rel="noopener noreferrer">2024 PL Summit Video (Remote Update)</a>',
      );
    });

    it('handles mailto and http as well as https', () => {
      expect(normalizeJobDescriptionHtml('[protocol.ai](http://protocol.ai)')).toContain('href="http://protocol.ai"');
      expect(normalizeJobDescriptionHtml('[Email us](mailto:jobs@example.com)')).toContain(
        'href="mailto:jobs@example.com"',
      );
    });

    /**
     * The reason the scheme check mirrors the sanitizer's own allowlist. These
     * would each resolve against OUR origin, so the sanitizer would strip the
     * href and leave an anchor that goes nowhere — worse than the brackets.
     */
    it.each([
      ['a root-relative path', '[Careers](/careers)'],
      ['a bare relative path', '[Founder PE](founder-pe)'],
      ['an in-page jump', '[jump](#full-stack-pe)'],
      ['a protocol-relative URL', '[nope](//evil.test/x)'],
    ])('leaves %s as literal text', (_label, input) => {
      expect(normalizeJobDescriptionHtml(input)).toBe(input);
    });

    /** A function that emits markup does not get to rely on its caller to make
     *  that markup safe, even though the sanitizer does run afterwards. */
    it.each([
      ['a javascript: URL', '[Click](javascript:alert(1))'],
      ['a quote that would close the href', '[X](https://x.test/"onmouseover="alert(1))'],
      ['an angle bracket', '[X](https://x.test/<script>)'],
    ])('refuses to build an anchor from %s', (_label, input) => {
      expect(normalizeJobDescriptionHtml(input)).toBe(input);
    });

    /** Syntax inside an existing link or inside code is not prose. */
    it.each([
      ['an existing anchor', '<p><a href="https://a.test">[X](https://b.test)</a></p>'],
      ['a code span', '<p><code>[X](https://b.test)</code></p>'],
      ['a pre block', '<pre>[X](https://b.test)</pre>'],
    ])('does not touch syntax inside %s', (_label, input) => {
      expect(normalizeJobDescriptionHtml(input)).toBe(input);
    });

    /**
     * The label is a slice of an already-escaped text node. Re-escaping it —
     * the obvious thing to copy from `linkifyHtml` — would put back the very
     * `&amp;amp;` the first transform just removed.
     */
    it('does not re-escape a label that already contains an entity', () => {
      expect(normalizeJobDescriptionHtml('[Ben &amp; Jerry](https://benjerry.test)')).toBe(
        '<a href="https://benjerry.test" target="_blank" rel="noopener noreferrer">Ben &amp; Jerry</a>',
      );
    });
  });

  describe('lists the converter cut up', () => {
    it('folds a run of one-item lists back into one list', () => {
      expect(normalizeJobDescriptionHtml('<ul><li>a</li></ul><ul><li>b</li></ul><ul><li>c</li></ul>')).toBe(
        '<ul><li>a</li><li>b</li><li>c</li></ul>',
      );
    });

    it('merges ordered lists the same way', () => {
      expect(normalizeJobDescriptionHtml('<ol><li>a</li></ol><ol><li>b</li></ol>')).toBe(
        '<ol><li>a</li><li>b</li></ol>',
      );
    });

    /** Different list types are different lists, whatever the spacing says. */
    it('will not merge a bulleted list into a numbered one', () => {
      const input = '<ul><li>a</li></ul><ol><li>b</li></ol>';
      expect(normalizeJobDescriptionHtml(input)).toBe(input);
    });

    /** A real boundary is anything at all between the two lists. This is what
     *  keeps the CMO posting's ten section lists from collapsing into one. */
    it.each([
      ['a heading', '<ul><li>a</li></ul><h2>Skills</h2><ul><li>b</li></ul>'],
      ['a paragraph', '<ul><li>a</li></ul><p><strong>Bonus Skills</strong></p><ul><li>b</li></ul>'],
    ])('keeps lists separated by %s apart', (_label, input) => {
      expect(normalizeJobDescriptionHtml(input)).toBe(input);
    });

    it('leaves nested lists alone', () => {
      const input = '<ul><li>a<ul><li>b</li></ul></li><li>c<ul><li>d</li></ul></li></ul>';
      expect(normalizeJobDescriptionHtml(input)).toBe(input);
    });
  });

  /**
   * 78 of the 83 live bodies are already well-formed — Ashby, Lever, Gem,
   * HealthcareAgents — and must come out of this function byte-identical. That
   * property is what lets the pass run unconditionally instead of sniffing the
   * posting's source host.
   */
  describe('bodies that arrive well-formed', () => {
    it.each([
      ['an Ashby-style body', '<h3>Responsibilities</h3><p><strong>bold</strong></p><ul><li>one</li><li>two</li></ul>'],
      [
        'a Gem-style body, whose only structure is <br>',
        '<strong>About Us:</strong><br /><span>We build things.</span>',
      ],
      ['a body with a real anchor', '<p>See <a href="https://example.com/apply">our site</a></p>'],
      ['prose with an ampersand', '<p>Hello <strong>world</strong> &amp; friends</p>'],
    ])('passes %s through untouched', (_label, input) => {
      expect(normalizeJobDescriptionHtml(input)).toBe(input);
    });

    it('survives an empty or null body', () => {
      expect(normalizeJobDescriptionHtml('')).toBe('');
      expect(normalizeJobDescriptionHtml(null as unknown as string)).toBe('');
    });
  });

  /**
   * The pipeline as the drawer actually runs it. These assert the OUTPUT of
   * sanitizing the normalized string, because that is the markup the page gets
   * and the ordering is the security property.
   */
  describe('composed with the sanitizer, in that order', () => {
    const render = (html: string) => sanitizeJobDescriptionHtml(normalizeJobDescriptionHtml(html));

    /**
     * The case that decides the entity pattern. A posting whose author wrote a
     * tag, escaped twice by the ingest, must come out as visible text — never
     * as a live element. It stays text because decoding one layer of
     * `&amp;lt;` yields `&lt;`, which is still an entity.
     */
    it('cannot be made to produce a live tag from a double-escaped one', () => {
      expect(render('<p>&amp;lt;img src=x onerror=alert(1)&amp;gt;</p>')).toBe(
        '<p>&lt;img src=x onerror=alert(1)&gt;</p>',
      );
    });

    it('still drops everything the allowlist drops', () => {
      expect(render('<p onclick="alert(1)">hi</p><script>alert(1)</script>')).toBe('<p>hi</p>');
    });

    it('unwraps a Greenhouse-encoded body and then drops the chrome the allowlist drops', () => {
      expect(
        render(
          '&lt;div class="content-intro"&gt;&lt;div class="c-virtual_list__item"&gt;&lt;p&gt;We are on a mission&lt;/p&gt;&lt;/div&gt;&lt;/div&gt;',
        ),
      ).toBe('<p>We are on a mission</p>');
    });

    it('produces an anchor the sanitizer is willing to keep', () => {
      expect(render('<p>[Protocol Labs](https://protocol.ai/) hires</p>')).toBe(
        '<p><a href="https://protocol.ai/" target="_blank" rel="noopener noreferrer">Protocol Labs</a> hires</p>',
      );
    });

    /** An abbreviated slice of the real CMO posting — all three defects in the
     *  shape they actually arrive in, so this fails if the ingest changes. */
    it('repairs a real posting end to end', () => {
      const posting =
        '<h1>About Protocol Labs</h1>' +
        '<p>[Protocol Labs](https://protocol.ai/) is an innovation network.</p>' +
        '<h2>Key Responsibilities</h2>' +
        '<p><strong>Ecosystem Growth &amp;amp; Network Effects</strong></p>' +
        '<ul><li>Design and scale ecosystem growth loops</li></ul>' +
        '<ul><li>Build durable distribution systems</li></ul>';

      expect(render(posting)).toBe(
        '<h1>About Protocol Labs</h1>' +
          '<p><a href="https://protocol.ai/" target="_blank" rel="noopener noreferrer">Protocol Labs</a> is an innovation network.</p>' +
          '<h2>Key Responsibilities</h2>' +
          '<p><strong>Ecosystem Growth &amp; Network Effects</strong></p>' +
          '<ul><li>Design and scale ecosystem growth loops</li><li>Build durable distribution systems</li></ul>',
      );
    });
  });
});
