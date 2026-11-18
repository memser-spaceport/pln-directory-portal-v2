import { htmlToPlainText } from '@/utils/html';

describe('htmlToPlainText (LAB-3299)', () => {
  it('drops tags, joins inline tags and separates blocks', () => {
    expect(htmlToPlainText('<p>Protocol <b>Labs</b>.</p><p>Second</p>')).toBe('Protocol Labs. Second');
    expect(htmlToPlainText('<ul><li>One</li><li>Two</li></ul>')).toBe('One Two');
  });

  it('decodes entities after the tags go, so an escaped tag stays text', () => {
    expect(htmlToPlainText('a &lt;b&gt; &amp; &quot;c&quot;&nbsp;d')).toBe('a <b> & "c" d');
    expect(htmlToPlainText('&amp;lt;')).toBe('&lt;');
  });

  it('caps the text with "…" only when it is longer than max', () => {
    expect(htmlToPlainText('<p>short</p>', 300)).toBe('short');
    const capped = htmlToPlainText(`<p>${'a'.repeat(400)}</p>`, 300);
    expect(capped).toHaveLength(301);
    expect(capped.endsWith('…')).toBe(true);
  });

  it('gives an empty string for no value', () => {
    expect(htmlToPlainText(null)).toBe('');
    expect(htmlToPlainText(undefined)).toBe('');
    expect(htmlToPlainText('<p></p>')).toBe('');
  });
});
