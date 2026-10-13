/**
 * An image's size and text wrap are only useful if they survive every boundary
 * the content crosses between the composer and a reader's screen. There are
 * three, and each of them used to drop them:
 *
 * - the `<img width>` / wrap class RichTextEditor writes → NodeBB's markdown
 *   storage, where an image is `![alt](src)` and has nowhere to keep either
 * - that markdown → the HTML the forum renders and re-edits
 * - that HTML → the sanitizer every forum body is read through
 */
import { convertMarkdownImagesToHtml, extractTextWithImages, replaceImagesWithMarkdown } from '@/utils/decode';
import { encodeImageLayoutInSrc } from '@/utils/html/encodeImageLayoutInSrc';
import { decodeImageLayoutFromSrc } from '@/utils/html/decodeImageLayoutFromSrc';
import { sanitizeForumPostHtml } from '@/utils/html/sanitizeForumPostHtml';
import { processPostContent } from '@/components/page/forum/Post';

const SRC = 'https://images.example.com/uploads/diagram.png';

describe('image layout in a markdown src', () => {
  it('round-trips a width and a wrap through the fragment', () => {
    const encoded = encodeImageLayoutInSrc(SRC, { width: '45%', float: 'left' });

    expect(encoded).toBe(`${SRC}#w=45,f=left`);
    expect(decodeImageLayoutFromSrc(encoded)).toEqual({ src: SRC, width: '45%', float: 'left' });
  });

  it('separates the two values with a comma, which survives an HTML round trip', () => {
    // `&` does not: a src attribute carrying one comes back out of innerHTML
    // as `&amp;`, and the fragment stopped being recognised — the layout was
    // lost on save, and a new fragment piled on top of the old one each time.
    expect(encodeImageLayoutInSrc(SRC, { width: '45%', float: 'left' })).not.toContain('&');
  });

  it('carries either half on its own', () => {
    expect(decodeImageLayoutFromSrc(encodeImageLayoutInSrc(SRC, { width: '30%' }))).toEqual({
      src: SRC,
      width: '30%',
    });
    expect(decodeImageLayoutFromSrc(encodeImageLayoutInSrc(SRC, { float: 'right' }))).toEqual({
      src: SRC,
      float: 'right',
    });
  });

  it('leaves the src alone when there is no layout to carry', () => {
    expect(encodeImageLayoutInSrc(SRC, {})).toBe(SRC);
    expect(decodeImageLayoutFromSrc(SRC)).toEqual({ src: SRC });
  });

  it('replaces a stale fragment instead of stacking a second one', () => {
    expect(encodeImageLayoutInSrc(`${SRC}#w=45,f=left`, { width: '80%' })).toBe(`${SRC}#w=80`);
  });

  it('reads content the escaped separator broke, and heals it on the next save', () => {
    // What four rounds of saving produced in the wild: each save appended
    // another fragment because it could not see the one already there.
    const stacked = `${SRC}#w=33&amp;f=right#w=39&amp;f=right#w=38&amp;f=right#w=31&f=right`;

    // The last one is what the author saved last.
    expect(decodeImageLayoutFromSrc(stacked)).toEqual({ src: SRC, width: '31%', float: 'right' });
    // And the whole chain comes off, so the next save writes exactly one.
    expect(encodeImageLayoutInSrc(stacked, { width: '31%', float: 'right' })).toBe(`${SRC}#w=31,f=right`);
  });

  it('ignores a pixel width — only a percentage renders the same in a narrower view', () => {
    expect(encodeImageLayoutInSrc(SRC, { width: '320px' })).toBe(SRC);
  });

  it('leaves a fragment it did not write on the src', () => {
    expect(decodeImageLayoutFromSrc(`${SRC}#section-2`)).toEqual({ src: `${SRC}#section-2` });
  });
});

describe('forum post round-trip', () => {
  it('keeps size and wrap when an editor body becomes markdown', () => {
    const markdown = replaceImagesWithMarkdown(`<p><img src="${SRC}" class="ql-img-float-left" width="45%"></p>`);

    expect(markdown).toContain(`(${SRC}#w=45,f=left)`);
    expect(markdown).toContain('![diagram.png]');
  });

  it('does not stack a fragment when a saved body is edited and saved again', () => {
    // The editor hands its HTML back with the src escaped, exactly as
    // innerHTML serialises it.
    const reopened = `<p><img src="${SRC}#w=45&amp;f=left" class="ql-img-float-right" width="30%"></p>`;

    expect(replaceImagesWithMarkdown(reopened)).toContain(`(${SRC}#w=30,f=right)`);
  });

  it('does not leak the fragment into the alt text it derives from the filename', () => {
    expect(replaceImagesWithMarkdown(`<img src="${SRC}#w=45" width="45%">`)).toContain('![diagram.png]');
  });

  it('restores both when that markdown is loaded back for editing', () => {
    const html = convertMarkdownImagesToHtml(`![diagram.png](${SRC}#w=45,f=left)`);

    expect(html).toBe(`<img src="${SRC}" alt="diagram.png" width="45%" class="ql-img-float-left" />`);
  });

  it('survives a full save-and-reopen cycle', () => {
    const saved = replaceImagesWithMarkdown(`<p><img src="${SRC}" class="ql-img-float-right" width="45%"></p>`);

    expect(convertMarkdownImagesToHtml(saved)).toContain('width="45%"');
    expect(convertMarkdownImagesToHtml(saved)).toContain('class="ql-img-float-right"');
  });

  it('renders size, wrap and the bare src on the forum page', () => {
    const { processedContent, imageUrls } = processPostContent(`![diagram.png](${SRC}#w=45,f=left)`);

    expect(processedContent).toContain('width="45%"');
    expect(processedContent).toContain('class="ql-img-float-left"');
    expect(processedContent).toContain(`src="${SRC}"`);
    expect(imageUrls).toEqual([SRC]);
  });

  it('drops the inline vertical margin from a wrapped image, which would beat the class', () => {
    const wrapped = processPostContent(`![diagram.png](${SRC}#f=left)`).processedContent;
    const plain = processPostContent(`![diagram.png](${SRC})`).processedContent;

    expect(wrapped).not.toContain('margin');
    expect(plain).toContain('margin: 8px 0');
  });

  it('leaves content written before layouts were storable unchanged', () => {
    const { processedContent } = processPostContent(`![diagram.png](${SRC})`);

    expect(processedContent).toContain(`src="${SRC}"`);
    expect(processedContent).not.toContain('width=');
    expect(processedContent).not.toContain('class=');
  });
});

/**
 * The same trip again, but starting from the markup the editor really produces
 * — captured out of a live Quill after a wrap and a move — and going round
 * twice, because saving an already-saved post is where this broke: the
 * fragment came back escaped, wasn't recognised, and a second one was appended
 * on top of it.
 */
describe('a post saved, reopened and saved again', () => {
  const EDITOR_HTML =
    '<p>Round trip check. <img src="https://pl-directory-images-dev.s3.us-west-1.amazonaws.com/19cf620c2f7e47b5.jpeg" width="50%" class="ql-img-float-right">Round trip check.</p>';
  const IMAGE = 'https://pl-directory-images-dev.s3.us-west-1.amazonaws.com/19cf620c2f7e47b5.jpeg';

  it('carries size and wrap out to NodeBB', () => {
    expect(replaceImagesWithMarkdown(EDITOR_HTML)).toContain(`(${IMAGE}#w=50,f=right)`);
  });

  it('gives them back to the editor when the post is reopened', () => {
    const reopened = convertMarkdownImagesToHtml(replaceImagesWithMarkdown(EDITOR_HTML));

    expect(reopened).toContain('width="50%"');
    expect(reopened).toContain('class="ql-img-float-right"');
  });

  it('saves the reopened post to exactly the same markdown, with no second fragment', () => {
    const saved = replaceImagesWithMarkdown(EDITOR_HTML);
    const reopened = convertMarkdownImagesToHtml(saved);

    expect(replaceImagesWithMarkdown(reopened)).toBe(saved);
    expect(replaceImagesWithMarkdown(reopened).match(/#w=/g)).toHaveLength(1);
  });

  it('renders them for a reader', () => {
    const { processedContent } = processPostContent(replaceImagesWithMarkdown(EDITOR_HTML));

    expect(processedContent).toContain('width="50%"');
    expect(processedContent).toContain('class="ql-img-float-right"');
    expect(processedContent).toContain(`src="${IMAGE}"`);
  });
});

describe('sanitizeForumPostHtml', () => {
  it('keeps the size and wrap a reader needs to see the image as it was saved', () => {
    const clean = sanitizeForumPostHtml(`<img src="${SRC}" width="45%" class="ql-img-float-left">`);

    expect(clean).toContain('width="45%"');
    expect(clean).toContain('ql-img-float-left');
  });

  it('still drops everything it dropped before', () => {
    expect(sanitizeForumPostHtml('<img src="x.png" onerror="alert(1)">')).not.toContain('onerror');
    expect(sanitizeForumPostHtml('<script>alert(1)</script>')).toBe('');
  });
});

/**
 * A forum COMMENT takes the same trip as a post, through different code: the
 * submit path shares `replaceImagesWithMarkdown` and the render path shares
 * `processPostContent`, but editing one in place loads its stored content
 * through `extractTextWithImages`, which carries an image across only when it
 * is already an `<img>`.
 */
describe('editing a forum comment that has an image', () => {
  const STORED = `Nice work ![shot.png](${SRC}#w=50,f=right) see above`;

  it('hands the editor an image, not the markdown as text', () => {
    const forEditor = extractTextWithImages(convertMarkdownImagesToHtml(STORED));

    expect(forEditor).toContain('<img');
    expect(forEditor).not.toContain('![shot.png]');
  });

  it('brings the size and the wrap back with it', () => {
    const forEditor = extractTextWithImages(convertMarkdownImagesToHtml(STORED));

    expect(forEditor).toContain('width="50%"');
    expect(forEditor).toContain('class="ql-img-float-right"');
  });
});
