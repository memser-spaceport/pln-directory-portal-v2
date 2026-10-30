import { readNewsTags } from '@/utils/news-tags';

describe('readNewsTags (LAB-3000)', () => {
  it('reads the tags and the seeded marker', () => {
    expect(readNewsTags({ newsTags: ['ai', 'desci'], newsTagsSeeded: true })).toEqual({
      newsTags: ['ai', 'desci'],
      newsTagsSeeded: true,
    });
  });

  it('reads a saved empty list as a choice, not seeded', () => {
    expect(readNewsTags({ newsTags: [] })).toEqual({ newsTags: [], newsTagsSeeded: false });
  });

  it.each([null, undefined, {}, { newsTags: 'ai' }])('reads %p as no tags', (raw) => {
    expect(readNewsTags(raw)).toEqual({ newsTags: [], newsTagsSeeded: false });
  });

  it('drops entries that are not strings', () => {
    expect(readNewsTags({ newsTags: ['ai', 3, null] }).newsTags).toEqual(['ai']);
  });
});
