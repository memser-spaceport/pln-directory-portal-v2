import { findNewsByUrl, htmlToPlainText, isSafeHttpUrl, normalizeNewsUrl } from '@/services/team-news/newsUrl';
import type { ITeamNewsItem } from '@/types/team-news.types';

const item = (overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem =>
  ({
    uid: 'n-1',
    teamUid: 't-1',
    teamName: 'Team',
    teamLogoUrl: null,
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-01T00:00:00.000Z',
    title: 'Earlier story',
    summary: 'Summary',
    sourceUrl: 'https://example.com/post?utm_source=x',
    sourceDomain: 'example.com',
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: '2026-06-01T00:00:00.000Z',
    discussion: { count: 0, latestTopicUrl: null },
    ...overrides,
  }) as ITeamNewsItem;

describe('newsUrl helpers', () => {
  it('normalizes urls for duplicate detection', () => {
    expect(normalizeNewsUrl('https://www.example.com/post/?utm_source=x')).toBe(
      normalizeNewsUrl('https://example.com/post'),
    );
  });

  it('finds duplicate urls across sourceUrls', () => {
    const hit = findNewsByUrl([item({ sourceUrls: ['https://example.com/other'] })], 'https://example.com/other/');
    expect(hit?.uid).toBe('n-1');
  });

  it('strips html to plain text', () => {
    expect(htmlToPlainText('<p>Hello <em>world</em></p>')).toBe('Hello world');
  });

  it('accepts only http(s) urls', () => {
    expect(isSafeHttpUrl('https://example.com')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
  });
});
