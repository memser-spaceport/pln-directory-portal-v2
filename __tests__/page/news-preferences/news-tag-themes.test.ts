import { groupNewsTags, NEWS_TAG_THEMES, OTHER_THEME } from '@/components/page/news-preferences/newsTagThemes';

/** The 25 tags `GET /v1/team-news/tags` returned on the lab-2969 env (2026-10-28). */
const LIVE_TAGS = [
  'ai-robotics',
  'ai',
  'frontier-tech',
  'build-innovation-network',
  'capital',
  'defi',
  'development-infrastructure',
  'network-programs',
  'service-providers',
  'digital-human-rights',
  'blockchain-protocols',
  'blockchain-security',
  'cryptographic-proofs',
  'data-ownership',
  'decentralized-compute',
  'decentralized-storage',
  'self-sovereign-identity',
  'verifiable-content',
  'economies-governance',
  'climate-refi',
  'degov',
  'desci',
  'public-goods-funding',
  'neurotech',
  'whole-brain-emulation',
];

describe('groupNewsTags (LAB-3023)', () => {
  it("puts every live tag in one of Polina's themes, in her order, with nothing left for Other", () => {
    const themes = groupNewsTags(LIVE_TAGS);
    expect(themes.map((t) => t.title)).toEqual(NEWS_TAG_THEMES.map((t) => t.title));
    expect(themes.flatMap((t) => t.slugs).sort()).toEqual([...LIVE_TAGS].sort());
  });

  it('maps each tag to one theme only', () => {
    const all = NEWS_TAG_THEMES.flatMap((t) => t.slugs);
    expect(new Set(all).size).toBe(all.length);
  });

  it('leaves out themes with none of the given tags, and lists unknown tags under Other', () => {
    expect(groupNewsTags(['degov', 'new-area'])).toEqual([
      { title: 'Economies & governance', slugs: ['degov'] },
      { title: OTHER_THEME, slugs: ['new-area'] },
    ]);
  });

  it('matches a whole theme by name, and tags by part of their slug', () => {
    expect(groupNewsTags(LIVE_TAGS, 'Web3').map((t) => t.slugs.length)).toEqual([6]);
    expect(groupNewsTags(LIVE_TAGS, 'decentralized')).toEqual([
      { title: 'Web3 infrastructure', slugs: ['decentralized-compute', 'decentralized-storage'] },
    ]);
    expect(groupNewsTags(LIVE_TAGS, 'nothing-like-this')).toEqual([]);
  });
});
