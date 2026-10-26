import { filterStyle, sanitizeHtml } from '@/utils/html/sanitizeHtml';
import { parseSafeHtml } from '@/utils/html/parseSafeHtml';
import { isValidElement, type ReactElement } from 'react';

const dom = (html: string) => {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
};

const onAttributes = (root: Element) =>
  Array.from(root.querySelectorAll('*')).flatMap((el) =>
    Array.from(el.attributes)
      .map((a) => a.name)
      .filter((name) => name.startsWith('on')),
  );

describe('sanitizeHtml (richText)', () => {
  describe('code never runs', () => {
    it('removes a script tag from a bio and keeps the text', () => {
      expect(sanitizeHtml('<p>Hello</p><script>alert(1)</script>')).toBe('<p>Hello</p>');
    });

    it('removes event handlers from allowed tags', () => {
      const root = dom(sanitizeHtml('<p onclick="steal()">About us</p><img src=x onerror="steal()">'));
      expect(root.querySelector('p')?.textContent).toBe('About us');
      expect(onAttributes(root)).toEqual([]);
      expect(root.querySelector('img')).toBeNull();
    });

    it.each(['iframe', 'object', 'embed', 'form', 'style', 'base', 'meta', 'link'])('removes <%s>', (tag) => {
      const root = dom(
        sanitizeHtml(`<p>text</p><${tag} src="https://evil.example" href="https://evil.example"></${tag}>`),
      );
      expect(root.querySelector(tag)).toBeNull();
      expect(root.textContent).toContain('text');
    });

    it('returns an empty string for empty input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
    });
  });

  describe('allowed formatting still shows', () => {
    it('keeps bold, links and lists', () => {
      const root = dom(
        sanitizeHtml(
          '<p><strong>Founder</strong> of <a href="https://acme.example">Acme</a></p><ul><li>one</li><li>two</li></ul>',
        ),
      );
      expect(root.querySelector('strong')?.textContent).toBe('Founder');
      expect(root.querySelector('a')?.getAttribute('href')).toBe('https://acme.example');
      expect(root.querySelectorAll('ul > li')).toHaveLength(2);
    });

    it('keeps headings, quotes, code, rules and Quill classes', () => {
      const html =
        '<h2>Title</h2><blockquote>q</blockquote><pre><code>x</code></pre><hr><p class="ql-align-center"><u>u</u> <s>s</s></p>';
      expect(sanitizeHtml(html)).toBe(html);
    });

    it('keeps a methodology table with header and body rows', () => {
      const html =
        '<table><thead><tr><th>Signal</th><th>Weight</th></tr></thead><tbody><tr><td colspan="2">Team</td></tr></tbody></table>';
      expect(sanitizeHtml(html)).toBe(html);
    });

    it('keeps editor text colors and drops every other style property', () => {
      const root = dom(
        sanitizeHtml(
          '<span style="color: rgb(230, 0, 0); position: fixed; background-image: url(https://evil.example/x)">red</span>',
        ),
      );
      const span = root.querySelector('span')!;
      expect(span.style.color).toBe('rgb(230, 0, 0)');
      expect(span.style.position).toBe('');
      expect(span.style.backgroundImage).toBe('');
    });

    it('drops a style attribute that keeps nothing', () => {
      expect(sanitizeHtml('<span style="position: fixed">x</span>')).toBe('<span>x</span>');
    });

    it('keeps mention attributes', () => {
      const root = dom(
        sanitizeHtml(
          '<a class="ql-mention" data-mention="1" data-uid="m_1" data-name="Jane" href="/members/m_1">@Jane</a>',
        ),
      );
      const a = root.querySelector('a')!;
      expect(a.getAttribute('href')).toBe('/members/m_1');
      expect(a.dataset).toMatchObject({ mention: '1', uid: 'm_1', name: 'Jane' });
      expect(a.className).toBe('ql-mention');
    });

    it('does not keep images', () => {
      expect(sanitizeHtml('<p>a<img src="https://cdn.example/x.png">b</p>')).toBe('<p>ab</p>');
    });
  });

  describe('links are safe', () => {
    it.each([
      ['javascript:alert(1)'],
      ['JaVaScRiPt:alert(1)'],
      ['data:text/html;base64,PHNjcmlwdD4='],
      ['//evil.example/x'],
      ['vbscript:x'],
    ])('drops href %s and keeps the text', (href) => {
      const root = dom(sanitizeHtml(`<a href="${href}">click</a>`));
      const a = root.querySelector('a')!;
      expect(a.hasAttribute('href')).toBe(false);
      expect(a.textContent).toBe('click');
    });

    it.each([['https://acme.example/jobs'], ['http://acme.example'], ['mailto:hi@acme.example'], ['/members/m_1']])(
      'keeps href %s and opens it in a new tab',
      (href) => {
        const a = dom(sanitizeHtml(`<a href="${href}">x</a>`)).querySelector('a')!;
        expect(a.getAttribute('href')).toBe(href);
        expect(a.getAttribute('target')).toBe('_blank');
        expect(a.getAttribute('rel')).toBe('noopener noreferrer');
      },
    );
  });
});

describe('sanitizeHtml profiles', () => {
  it('keeps style off the profiles that do not allow it', () => {
    expect(sanitizeHtml('<span style="color: red">x</span>', 'forumPost')).toBe('<span>x</span>');
    expect(sanitizeHtml('<span style="color: red">x</span>', 'spv')).toBe('<span>x</span>');
  });

  it('does not let a richText style allowance leak into the next call', () => {
    sanitizeHtml('<span style="color: red">x</span>');
    expect(sanitizeHtml('<p style="color: red">x</p>', 'prd')).toBe('<p>x</p>');
  });

  it('keeps only highlight markup in search snippets', () => {
    expect(
      sanitizeHtml('<em class="x" onclick="y">match</em> <a href="https://e.example">l</a><b>b</b>', 'searchHighlight'),
    ).toBe('<em>match</em> l<b>b</b>');
  });
});

describe('filterStyle', () => {
  const colors = ['color', 'background-color'];

  it.each([
    ['color: url(https://evil.example/x)', ''],
    ['color: expression(alert(1))', ''],
    ['color: var(--x)', ''],
    ['color: "red"', ''],
    ['color: \\72 ed', ''],
    ['position: fixed !important; color: red', 'color: red'],
    ['COLOR: Red', 'color: Red'],
    ['color: /* c */ #e60000', 'color: #e60000'],
    ['background-color: rgba(0, 0, 0, 0.5)', 'background-color: rgba(0, 0, 0, 0.5)'],
    ['color: hsl(120deg 50% 50%)', 'color: hsl(120deg 50% 50%)'],
    ['color: red !important', 'color: red'],
  ])('%s → %s', (input, expected) => {
    expect(filterStyle(input, colors)).toBe(expected);
  });
});

describe('parseSafeHtml', () => {
  it('yields sanitized React elements only', () => {
    const out = parseSafeHtml('<p onclick=x>a</p><script>b</script>', 'forumPost');
    expect(isValidElement(out)).toBe(true);
    const el = out as ReactElement<Record<string, unknown>>;
    expect(el.type).toBe('p');
    expect(Object.keys(el.props)).toEqual(['children']);
  });
});
