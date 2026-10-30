import {
  focusAreaSlug,
  getNewsTagChips,
  getNewsTopicSlugs,
  NEWS_CARD_TOPIC_LIMIT,
  NEWS_VERB_TAGS,
} from '@/utils/news-tag-chips';

describe('focusAreaSlug', () => {
  // These must match the backend's slugify (apps/web-api/src/utils/helper/helper.ts),
  // which wrote the tags on news items.
  it('lowercases and joins words with a dash', () => {
    expect(focusAreaSlug('Digital Human Rights')).toBe('digital-human-rights');
    expect(focusAreaSlug('AI')).toBe('ai');
  });

  it('drops other characters instead of turning them into a dash, as the backend does', () => {
    expect(focusAreaSlug('AI & Robotics')).toBe('ai-robotics');
    expect(focusAreaSlug('VR/AR')).toBe('vrar');
    expect(focusAreaSlug('Climate / ReFi')).toBe('climate-refi');
    expect(focusAreaSlug("Founder's Fund")).toBe('founders-fund');
    expect(focusAreaSlug('Science&Tech')).toBe('sciencetech');
  });

  it('keeps underscores, collapses dashes and trims them', () => {
    expect(focusAreaSlug('DePIN_infra')).toBe('depin_infra');
    expect(focusAreaSlug('  Web3 / DeFi (core)!  ')).toBe('web3-defi-core');
  });
});

describe('getNewsTopicSlugs', () => {
  it('keeps the roots and their direct children, not deeper levels', () => {
    const slugs = getNewsTopicSlugs([
      { uid: 'r1', title: 'AI & Robotics', parentUid: null },
      { uid: 'c1', title: 'Machine Learning', parentUid: 'r1' },
      { uid: 'g1', title: 'Deep Nets', parentUid: 'c1' },
      { uid: 'r2', title: 'Decentralized Storage', parentUid: null },
    ]);
    expect(slugs).toEqual(['ai-robotics', 'machine-learning', 'decentralized-storage']);
  });
});

describe('getNewsTagChips', () => {
  const topics = new Set(['ai', 'digital-human-rights', 'decentralized-storage', 'ai-robotics']);

  it('keeps only topics by default, in tag order', () => {
    expect(getNewsTagChips(['longevity', 'digital-human-rights', 'ai'], topics)).toEqual([
      'digital-human-rights',
      'ai',
    ]);
  });

  it('never returns a verb tag, also as an extra', () => {
    const verbs = Array.from(NEWS_VERB_TAGS);
    expect(verbs).toEqual(
      expect.arrayContaining(['$', 'raise', 'launch', 'announce', 'fund', 'release', 'scale', 'pilot']),
    );
    expect(verbs).toHaveLength(16);
    expect(getNewsTagChips(['ai', ...verbs, 'longevity'], topics, { withExtras: true })).toEqual(['ai', 'longevity']);
  });

  it('puts every topic first, then the free-form extras, with withExtras', () => {
    expect(
      getNewsTagChips(['longevity', 'ai', 'launch', 'tokenomics', 'ai-robotics'], topics, { withExtras: true }),
    ).toEqual(['ai', 'ai-robotics', 'longevity', 'tokenomics']);
  });

  it('limits the topics to the card limit of 3', () => {
    expect(NEWS_CARD_TOPIC_LIMIT).toBe(3);
    expect(
      getNewsTagChips(['ai', 'digital-human-rights', 'decentralized-storage', 'ai-robotics'], topics, {
        topicLimit: NEWS_CARD_TOPIC_LIMIT,
      }),
    ).toEqual(['ai', 'digital-human-rights', 'decentralized-storage']);
  });

  it('drops empty tags and repeats, and handles no tags', () => {
    expect(getNewsTagChips(['ai', ' AI ', '', 'ai'], topics)).toEqual(['ai']);
    expect(getNewsTagChips([], topics, { withExtras: true })).toEqual([]);
    expect(getNewsTagChips(undefined, topics)).toEqual([]);
  });
});
