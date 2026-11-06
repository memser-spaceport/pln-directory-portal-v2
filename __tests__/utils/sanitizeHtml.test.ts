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
      expect(root.querySelector('img')?.hasAttribute('src')).toBe(false);
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

    it('keeps an uploaded image with its size and float', () => {
      const src = 'https://pl-directory-images-dev.s3.us-west-1.amazonaws.com/0180e254dae0c7cc.png';
      const img = dom(
        sanitizeHtml(
          `<p><img src="${src}" alt="shot" width="50%" height="120" class="ql-img-float-left" style="max-width: 100%"></p>`,
        ),
      ).querySelector('img')!;
      expect(img.getAttribute('src')).toBe(src);
      expect(img.getAttribute('alt')).toBe('shot');
      expect(img.getAttribute('width')).toBe('50%');
      expect(img.getAttribute('height')).toBe('120');
      expect(img.className).toBe('ql-img-float-left');
      expect(img.hasAttribute('style')).toBe(false);
    });

    it.each([
      ['http://cdn.example/x.png'],
      ['//cdn.example/x.png'],
      ['/assets/x.png'],
      ['data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='],
      ['javascript:alert(1)'],
    ])('drops a non-https image source %s', (src) => {
      const img = dom(sanitizeHtml(`<img src="${src}" onerror="steal()">`)).querySelector('img')!;
      expect(img.hasAttribute('src')).toBe(false);
      expect(img.hasAttribute('onerror')).toBe(false);
    });

    it('keeps the https-only image rule off other profiles', () => {
      expect(sanitizeHtml('<img src="/assets/uploads/x.png">', 'forumPost')).toBe('<img src="/assets/uploads/x.png">');
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

  it('keeps event description alignment and spacing', () => {
    const p = dom(
      sanitizeHtml('<p style="text-align: center; white-space: pre-wrap; font-size: 40px">Agenda</p>'),
    ).querySelector('p')!;
    expect(p.style.textAlign).toBe('center');
    expect(p.style.whiteSpace).toBe('pre-wrap');
    expect(p.style.fontSize).toBe('');
  });

  describe('methodology', () => {
    const DIAGRAM =
      '<h2>How it works</h2><figure><svg class="ms-svg" viewBox="0 0 880 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Flow" aria-describedby="d1">' +
      '<title>Flow</title><desc id="d1">Steps</desc>' +
      '<defs><marker id="ms-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path class="ms-arrowhead" d="M0,0 L10,5 L0,10 z"></path></marker>' +
      '<style>.ms-node{fill:#eef2f7}</style></defs>' +
      '<rect class="ms-node" x="40" y="20" width="200" height="60" rx="8"></rect>' +
      '<text class="ms-text" x="140" y="55" text-anchor="middle"><tspan x="140" y="50">Source</tspan></text>' +
      '<line class="ms-edge" x1="440" y1="88" x2="440" y2="120" marker-end="url(#ms-arrow)"></line>' +
      '</svg></figure><table><tbody><tr><td><code>score</code></td></tr></tbody></table>';

    it('keeps the flow diagrams, their style block and marker references', () => {
      const root = dom(sanitizeHtml(DIAGRAM, 'methodology'));
      expect(root.querySelector('figure > svg')).not.toBeNull();
      expect(root.querySelector('svg style')?.textContent).toBe('.ms-node{fill:#eef2f7}');
      expect(root.querySelector('marker#ms-arrow path')).not.toBeNull();
      expect(root.querySelector('line')?.getAttribute('marker-end')).toBe('url(#ms-arrow)');
      expect(root.querySelector('rect')?.getAttribute('x')).toBe('40');
      expect(root.querySelector('tspan')?.textContent).toBe('Source');
      expect(root.querySelector('table code')?.textContent).toBe('score');
    });

    it('still removes scripts, handlers and javascript: links inside the SVG', () => {
      const root = dom(
        sanitizeHtml(
          '<svg><script>alert(1)</script><rect onload="steal()" width="1"></rect><a href="javascript:alert(1)"><text>x</text></a><foreignObject><iframe src="https://evil.example"></iframe></foreignObject></svg><form><input></form>',
          'methodology',
        ),
      );
      expect(root.querySelector('script, iframe, form, input, foreignObject')).toBeNull();
      expect(onAttributes(root)).toEqual([]);
      expect(root.querySelector('a')?.getAttribute('href') ?? null).toBeNull();
    });

    it('is not what richText does', () => {
      expect(dom(sanitizeHtml(DIAGRAM)).querySelector('svg')).toBeNull();
    });
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

  const layout = ['text-align', 'white-space'];

  it.each([
    ['text-align: center', 'text-align: center'],
    ['white-space: pre-wrap', 'white-space: pre-wrap'],
    ['text-align: center; white-space: pre-wrap; position: absolute', 'text-align: center; white-space: pre-wrap'],
    ['text-align: url(https://evil.example/x)', ''],
    ['white-space: expression(alert(1))', ''],
    ['text-align: -webkit-center', ''],
  ])('%s → %s', (input, expected) => {
    expect(filterStyle(input, layout)).toBe(expected);
  });

  it('drops a listed property it has no value rule for', () => {
    expect(filterStyle('position: fixed', ['position'])).toBe('');
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
