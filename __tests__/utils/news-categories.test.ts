import { NEWS_PREFERENCE_CATEGORIES, narrowsNewsCategories, readNewsCategories } from '@/utils/news-categories';

describe('news categories (LAB-2941)', () => {
  it('offers the six backend news types, without Deals or Hiring', () => {
    expect(NEWS_PREFERENCE_CATEGORIES).toEqual([
      'FUNDING',
      'LAUNCH',
      'PARTNERSHIP',
      'ANNOUNCEMENT',
      'MILESTONE',
      'OTHER',
    ]);
  });

  it('reads the stored list, in category order, ignoring unknown values', () => {
    expect(readNewsCategories({ newsCategories: ['OTHER', 'DEALS', 'FUNDING'] })).toEqual(['FUNDING', 'OTHER']);
  });

  it.each([[undefined], [null], [{}], [{ newsCategories: 'FUNDING' }], [{ newsCategories: ['DEALS'] }]])(
    'falls back to every category for %p',
    (raw) => {
      expect(readNewsCategories(raw)).toEqual(NEWS_PREFERENCE_CATEGORIES);
    },
  );

  it('narrows only when a category is off', () => {
    expect(narrowsNewsCategories(NEWS_PREFERENCE_CATEGORIES)).toBe(false);
    expect(narrowsNewsCategories(['FUNDING'])).toBe(true);
  });
});
