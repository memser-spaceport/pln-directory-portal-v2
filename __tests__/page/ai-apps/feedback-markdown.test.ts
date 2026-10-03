import { htmlToMarkdown, markdownToHtml } from '@/components/page/ai-apps/utils/feedbackMarkdown';

describe('feedback note markdown', () => {
  it('turns Quill HTML into markdown, with its &nbsp; spaces as spaces', () => {
    expect(
      htmlToMarkdown(
        '<h2>Late&nbsp;tile</h2><p>Shows&nbsp;<strong>late&nbsp;</strong>see&nbsp;<a href="https://x.test">this</a></p><p></p>' +
          '<ul><li>one</li><li>two<ul><li>nested</li></ul></li></ul><ol><li>first</li></ol>' +
          '<p><img src="https://cdn.test/i.png" alt="pic"></p>',
      ),
    ).toBe(
      '## Late tile\n\nShows **late** see [this](https://x.test)\n\n- one\n- two\n  - nested\n\n1. first\n\n![pic](https://cdn.test/i.png)',
    );
  });

  it('keeps text typed in Rich as text: no stray emphasis, headings or lists', () => {
    expect(
      htmlToMarkdown('<p>2 * 3 a &lt; b &amp; c snake_case _x_</p><p># not a heading</p><p>1. not a list</p>'),
    ).toBe('2 \\* 3 a < b & c snake_case \\_x\\_\n\n\\# not a heading\n\n1\\. not a list');
  });

  it('comes back to the same markdown through the Rich view', () => {
    const source =
      '## Title\n\nSome **bold** and [a link](https://x.test)\n\n- one\n  - nested\n\n![pic](https://cdn.test/i.png)';
    expect(htmlToMarkdown(markdownToHtml(source))).toBe(source);
  });

  it('passes HTML blocks after the note through, for the screenshots', () => {
    expect(markdownToHtml('a < b\n\n<p><img src="https://cdn.test/s.png" data-annotations="%7B%7D"></p>')).toBe(
      '<p>a &lt; b</p><p><img src="https://cdn.test/s.png" data-annotations="%7B%7D"></p>',
    );
  });
});
