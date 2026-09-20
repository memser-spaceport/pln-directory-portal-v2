import { getNewsPreviewSnippet } from '@/services/team-news/newsPreviewSnippet';
import type { ITeamNewsItem } from '@/types/team-news.types';

const item = (overrides: Partial<ITeamNewsItem>): ITeamNewsItem => ({ ...overrides }) as ITeamNewsItem;

describe('getNewsPreviewSnippet', () => {
  it('prefers the card teaser', () => {
    const snippet = getNewsPreviewSnippet(item({ summary: '  Acme raised $10M.  ', contentHtml: '<p>Ignored</p>' }));
    expect(snippet).toBe('Acme raised $10M.');
  });

  it('falls back to the rich body flattened to text', () => {
    const snippet = getNewsPreviewSnippet(
      item({ summary: null, contentHtml: '<p>Acme &amp; Co</p><p>raised $10M</p>' }),
    );
    expect(snippet).toBe('Acme & Co raised $10M');
  });

  it('returns an empty string when the item carries neither', () => {
    expect(getNewsPreviewSnippet(item({ summary: null }))).toBe('');
  });

  it('truncates at a word boundary so the platform does not slice mid-word', () => {
    const snippet = getNewsPreviewSnippet(item({ summary: 'wordy '.repeat(60) }));

    expect(snippet.length).toBeLessThanOrEqual(201);
    expect(snippet.endsWith('wordy…')).toBe(true);
  });

  it('leaves a summary that already fits untouched', () => {
    const summary = 'a'.repeat(200);
    expect(getNewsPreviewSnippet(item({ summary }))).toBe(summary);
  });
});
