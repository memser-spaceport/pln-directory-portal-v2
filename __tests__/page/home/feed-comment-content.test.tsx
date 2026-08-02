import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import {
  FeedCommentContent,
  hasRenderableContent,
} from '@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentContent';

/** The exact anchor RichTextEditor's MentionBlot emits. */
const MENTION =
  '<a class="ql-mention" href="/members/m_7fa2" data-uid="m_7fa2" data-external-id="ext-1" ' +
  'data-name="Jane Doe" target="_blank" rel="noopener noreferrer">@Jane Doe</a>';

describe('FeedCommentContent — links', () => {
  it('turns a bare URL into a link', () => {
    render(<FeedCommentContent html="<p>see https://example.com/docs</p>" />);

    const link = screen.getByRole('link', { name: 'https://example.com/docs' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('leaves a trailing sentence period outside the link', () => {
    render(<FeedCommentContent html="<p>see https://example.com.</p>" />);

    expect(screen.getByRole('link', { name: 'https://example.com' })).toBeInTheDocument();
  });

  it('does not double-link a URL the editor already anchored on paste', () => {
    render(<FeedCommentContent html='<p><a href="https://example.com">https://example.com</a></p>' />);

    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('linkifies a legacy plain-text comment with no markup at all', () => {
    render(<FeedCommentContent html="ship it https://example.com" />);

    expect(screen.getByRole('link', { name: 'https://example.com' })).toBeInTheDocument();
  });
});

describe('FeedCommentContent — mentions', () => {
  it('keeps the mention anchor intact, identity attributes and all', () => {
    render(<FeedCommentContent html={`<p>thanks ${MENTION}!</p>`} />);

    const mention = screen.getByRole('link', { name: '@Jane Doe' });
    // The relative href is the reason this component can't reuse
    // NewsDetailModal's /^https?:/i URI allowlist.
    expect(mention).toHaveAttribute('href', '/members/m_7fa2');
    expect(mention).toHaveAttribute('data-uid', 'm_7fa2');
    expect(mention).toHaveClass('ql-mention');
  });

  it('does not linkify inside a mention', () => {
    render(<FeedCommentContent html={`<p>${MENTION} https://example.com</p>`} />);

    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByRole('link', { name: '@Jane Doe' })).toBeInTheDocument();
  });
});

describe('FeedCommentContent — sanitizing', () => {
  it('strips a script tag', () => {
    const { container } = render(<FeedCommentContent html="<p>hi</p><script>alert(1)</script>" />);

    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toBe('hi');
  });

  it('strips an inline event handler', () => {
    const { container } = render(<FeedCommentContent html={`<p onmouseover="alert(1)">hover</p>`} />);

    expect(container.querySelector('p')).not.toHaveAttribute('onmouseover');
  });

  it('drops a javascript: href', () => {
    render(<FeedCommentContent html={`<p><a href="javascript:alert(1)">click</a></p>`} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('refuses an href that tries to break out of the attribute', () => {
    // URL_REGEX accepts everything up to whitespace, `"` included, so linkify
    // has to escape before interpolating.
    const { container } = render(<FeedCommentContent html={`<p>https://x.test/"onmouseover="alert(1)</p>`} />);

    expect(container.querySelector('[onmouseover]')).toBeNull();
  });

  it('drops tags outside the three-tag allowlist, keeping their text', () => {
    // A forum post can carry images and headings; a feed card renders neither.
    const { container } = render(<FeedCommentContent html="<h1>Title</h1><img src='x.png'><p>body</p>" />);

    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('body');
  });

  it('renders a legacy comment containing a stray angle bracket literally', () => {
    render(<FeedCommentContent html="a < b" />);

    expect(screen.getByText('a < b')).toBeInTheDocument();
  });
});

describe('hasRenderableContent', () => {
  it('is false for an image-only forum comment', () => {
    // Truthy raw, but nothing survives the allowlist — the caller must fall
    // back to "shared an image or file" instead of rendering a blank row.
    expect(hasRenderableContent('<img src="https://example.com/a.png">')).toBe(false);
  });

  it('is false for Quill’s empty value', () => {
    expect(hasRenderableContent('<p><br></p>')).toBe(false);
  });

  it('is false for whitespace-only content', () => {
    expect(hasRenderableContent('<p>&nbsp; </p>')).toBe(false);
  });

  it('is true for a comment that is only a mention', () => {
    expect(hasRenderableContent(`<p>${MENTION}</p>`)).toBe(true);
  });

  it('is true for legacy plain text', () => {
    expect(hasRenderableContent('just text')).toBe(true);
  });
});
