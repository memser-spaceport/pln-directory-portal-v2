import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import {
  FeedCommentContent,
  hasRenderableContent,
} from '@/components/page/home/TeamNews/components/FeedCommentsThread/FeedCommentContent';

/** Where the forum composer's uploads live. */
const IMAGE_SRC = 'https://images.example.com/uploads/shot.png';

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

  it('drops tags outside the allowlist, keeping their text', () => {
    // A forum post can carry headings; a feed card renders none. Images are the
    // exception — see the image suite below.
    const { container } = render(<FeedCommentContent html="<h1>Title</h1><blockquote>q</blockquote><p>body</p>" />);

    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('blockquote')).toBeNull();
    expect(container.textContent).toContain('body');
  });

  it('renders a legacy comment containing a stray angle bracket literally', () => {
    render(<FeedCommentContent html="a < b" />);

    expect(screen.getByText('a < b')).toBeInTheDocument();
  });
});

describe('hasRenderableContent', () => {
  it('is true for an image-only forum comment', () => {
    // An image carries no text, so isBlankHtml alone calls this blank and the
    // caller renders "shared an image or file" INSTEAD of the image.
    expect(hasRenderableContent(`![shot.png](${IMAGE_SRC})`)).toBe(true);
    expect(hasRenderableContent('<img src="https://example.com/a.png">')).toBe(true);
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

/**
 * NodeBB stores a forum comment as plain text with its images left as
 * `![alt](src)` — there is no <img> and no <p> anywhere in it. Rendering that
 * string as-is is what showed members the markdown instead of the picture.
 */
describe('FeedCommentContent — forum images', () => {
  it('renders a markdown image as an image', () => {
    const { container } = render(<FeedCommentContent html={`Nice work ![shot.png](${IMAGE_SRC}) see above`} />);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', IMAGE_SRC);
    expect(img).toHaveAttribute('alt', 'shot.png');
    expect(container.textContent).toContain('Nice work');
    expect(container.textContent).not.toContain('![shot.png]');
  });

  it('keeps the size and text wrap the author saved on the forum', () => {
    // Both survive NodeBB's markdown storage in the src fragment, and both are
    // easy to lose again: `width` is dropped unless the sanitizer is told the
    // attribute is not a URL, and the fragment must come off the src.
    const { container } = render(<FeedCommentContent html={`![shot.png](${IMAGE_SRC}#w=50,f=right)`} />);

    const img = container.querySelector('img');
    expect(img).toHaveAttribute('width', '50%');
    expect(img).toHaveClass('ql-img-float-right');
    expect(img).toHaveAttribute('src', IMAGE_SRC);
  });

  it('renders an image served from a root-relative forum path', () => {
    // The allowlist used to admit only /members/ among relative URLs, which is
    // not where an upload lives.
    const { container } = render(<FeedCommentContent html="![diagram](/assets/uploads/files/diagram.png)" />);

    expect(container.querySelector('img')).toHaveAttribute('src', '/assets/uploads/files/diagram.png');
  });

  it('does not also render the image URL as a link', () => {
    // Convert before linkify, or the URL is still bare text when linkify runs
    // and the member gets an anchor pointing at a .png next to the picture.
    const { container } = render(<FeedCommentContent html={`![shot.png](${IMAGE_SRC})`} />);

    expect(container.querySelector('a')).toBeNull();
  });

  it('still linkifies a URL that is not an image', () => {
    render(<FeedCommentContent html={`![shot.png](${IMAGE_SRC}) and https://example.com/docs`} />);

    expect(screen.getByRole('link', { name: 'https://example.com/docs' })).toBeInTheDocument();
  });

  it('renders nothing executable from a hostile markdown image', () => {
    // The converter interpolates alt and src into an attribute unescaped; the
    // sanitizer running AFTER it is what makes that safe.
    const { container } = render(
      <FeedCommentContent html={'![" onerror="alert(1)](x.png) ![evil](javascript:alert(1))'} />,
    );

    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.querySelector('img[src^="javascript:"]')).toBeNull();
  });

  it('leaves a comment with no image untouched', () => {
    const { container } = render(<FeedCommentContent html={`<p>plain ${MENTION} comment</p>`} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.ql-mention')).toHaveAttribute('data-uid', 'm_7fa2');
    expect(container.textContent).toContain('plain');
  });
});
