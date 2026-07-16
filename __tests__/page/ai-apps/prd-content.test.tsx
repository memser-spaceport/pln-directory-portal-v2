import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

// react-markdown@9 is ESM-only, which next/jest does not transform; the
// markdown path's safety property (embedded HTML is escaped, never executed)
// is react-markdown's own documented guarantee. Here we stub it and focus on
// (a) the HTML/Markdown routing decision and (b) the DOMPurify config that we
// own — that is where an XSS would be introduced by our code.
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

import { PrdContent, isHtmlDocument } from '@/components/page/ai-apps/components/PrdContent';

describe('isHtmlDocument', () => {
  it.each(['<!doctype html><html></html>', '  <HTML lang="en">', '<head><title>x</title></head>', '<body>hi</body>'])(
    'routes full documents to the HTML path: %s',
    (prd) => {
      expect(isHtmlDocument(prd)).toBe(true);
    },
  );

  it.each(['# Heading', 'Text with <br> inline tag', '<https://example.com> autolink', '<div>bare fragment</div>'])(
    'routes everything ambiguous to the Markdown path: %s',
    (prd) => {
      expect(isHtmlDocument(prd)).toBe(false);
    },
  );
});

describe('PrdContent — Markdown path', () => {
  it('renders non-document content through the markdown renderer, not innerHTML', () => {
    const { getByTestId, container } = render(<PrdContent prd={'# Hi\n<script>window.x=1</script>'} />);
    expect(getByTestId('markdown')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });
});

describe('PrdContent — HTML path sanitization', () => {
  const renderHtml = (bodyHtml: string) => {
    const prd = `<!doctype html><html><body>${bodyHtml}</body></html>`;
    return render(<PrdContent prd={prd} />).container;
  };

  it('keeps benign structure', () => {
    const container = renderHtml('<h1>Title</h1><p>Hello <strong>world</strong></p>');
    expect(container.querySelector('h1')).toHaveTextContent('Title');
    expect(container.querySelector('strong')).toHaveTextContent('world');
  });

  it.each([
    ['script', '<script>window.x=1</script>'],
    ['iframe', '<iframe src="https://evil.example"></iframe>'],
    ['svg', '<svg onload="window.x=1"><circle /></svg>'],
    ['style', '<style>body{display:none}</style>'],
    ['form', '<form action="https://evil.example"><input name="pw" /></form>'],
    ['input', '<input type="password" />'],
    ['base', '<base href="https://evil.example/" />'],
    ['link', '<link rel="stylesheet" href="https://evil.example/x.css" />'],
  ])('strips <%s> entirely', (tag, html) => {
    const container = renderHtml(html);
    expect(container.querySelector(tag)).toBeNull();
  });

  it('strips event handlers and inline styles', () => {
    const container = renderHtml('<img src="https://x.example/a.png" onerror="window.x=1" style="position:fixed" />');
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).not.toHaveAttribute('onerror');
    expect(img).not.toHaveAttribute('style');
  });

  it('strips javascript: and data: URIs but keeps https links', () => {
    const container = renderHtml(
      '<a href="javascript:alert(1)">bad</a><a href="data:text/html,x">worse</a><a href="https://ok.example">ok</a>',
    );
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).not.toContain('javascript:alert(1)');
    expect(hrefs).not.toContain('data:text/html,x');
    expect(hrefs).toContain('https://ok.example');
  });

  it('forces links to open in a new tab with rel protection', () => {
    const container = renderHtml('<a href="https://ok.example" target="_self">link</a>');
    const link = container.querySelector('a[href="https://ok.example"]');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('strips id/name to prevent DOM clobbering', () => {
    const container = renderHtml('<p id="queryClient" name="location">x</p>');
    const p = container.querySelector('p');
    expect(p).not.toHaveAttribute('id');
    expect(p).not.toHaveAttribute('name');
  });
});
