/**
 * LAB-3089: a profile description with its own h1 (one team's About had "<h1>The Blockchain Development Platform")
 * gave the profile page a second h1. Profile descriptions render h1/h2 as h3; other rich text is unchanged.
 */
import { render } from '@testing-library/react';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { safeHtmlProps } from '@/utils/html';
import { demoteTopHeadings } from '@/utils/html/demoteTopHeadings';

describe('demoteTopHeadings', () => {
  it('turns h1 and h2 into h3, keeping attributes, and leaves h3+ and escaped text alone', () => {
    expect(demoteTopHeadings('<h1>A</h1><h2 dir="ltr">B</h2><h3>C</h3><p>&lt;h1&gt; text</p>')).toBe(
      '<h3>A</h3><h3 dir="ltr">B</h3><h3>C</h3><p>&lt;h1&gt; text</p>',
    );
  });
});

describe('profile descriptions', () => {
  const about = '<h1>The Blockchain Development Platform</h1><p>Body</p>';

  it('render no h1 when asked to demote headings', () => {
    const { container } = render(<SafeHtml html={about} demoteHeadings />);
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('h3')?.textContent).toBe('The Blockchain Development Platform');
    expect(safeHtmlProps(about, 'richText', { demoteHeadings: true }).dangerouslySetInnerHTML.__html).not.toMatch(
      /<h1/,
    );
  });

  it('keep the content as written by default', () => {
    const { container } = render(<SafeHtml html={about} />);
    expect(container.querySelector('h1')).not.toBeNull();
  });
});
