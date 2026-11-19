import { EVENT_TYPE_LABEL } from '@/components/page/home/TeamNews/utils/getEventTypeConfig';

/**
 * Themes for the News preferences tag picker (LAB-3023, Polina's grouping).
 *
 * An editorial map, not the focus-area hierarchy: the API's parents group tags
 * oddly for picking (blockchain-protocols sits under Digital Human Rights). Only
 * tags the page actually has are shown; a tag that isn't mapped here goes to
 * "Other", so a new focus area never disappears from the picker.
 */
export const NEWS_TAG_THEMES: ReadonlyArray<{ title: string; slugs: readonly string[] }> = [
  {
    title: 'AI & frontier tech',
    slugs: ['ai', 'ai-robotics', 'desci', 'frontier-tech', 'neurotech', 'whole-brain-emulation'],
  },
  {
    title: 'Web3 infrastructure',
    slugs: [
      'blockchain-protocols',
      'blockchain-security',
      'cryptographic-proofs',
      'decentralized-compute',
      'decentralized-storage',
      'development-infrastructure',
    ],
  },
  {
    title: 'Digital rights',
    slugs: ['data-ownership', 'digital-human-rights', 'self-sovereign-identity', 'verifiable-content'],
  },
  {
    title: 'Economies & governance',
    slugs: ['capital', 'climate-refi', 'defi', 'degov', 'economies-governance', 'public-goods-funding'],
  },
  {
    title: 'The network',
    slugs: ['build-innovation-network', 'network-programs', 'service-providers'],
  },
];

export const OTHER_THEME = 'Other';

/** Categories a member can pick in the same tag list (LAB-3140). Not focus-area slugs. */
export const NEWS_CATEGORY_TAG_VALUES = ['FUNDING', 'LAUNCH', 'ANNOUNCEMENT'] as const;

export type NewsCategoryTag = (typeof NEWS_CATEGORY_TAG_VALUES)[number];

/** Category chips that match `query`. An empty query returns all three, in list order. */
export function matchingNewsCategoryTags(query = ''): NewsCategoryTag[] {
  const q = normalize(query);
  return NEWS_CATEGORY_TAG_VALUES.filter((value) => {
    if (!q) return true;
    return normalize(EVENT_TYPE_LABEL[value]).includes(q) || value.toLowerCase().includes(q);
  });
}

export interface NewsTagTheme {
  title: string;
  slugs: string[];
}

/** "#Frontier tech" and "frontier-tech" both find #frontier-tech. */
function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[\s_]+/g, '-');
}

/**
 * The page's tags in themes, alphabetical within each, filtered by `query`. A
 * query that names a theme ("web3") shows the whole theme. Empty themes are left
 * out.
 */
export function groupNewsTags(slugs: readonly string[], query = ''): NewsTagTheme[] {
  const available = new Set(slugs);
  const mapped = new Set(NEWS_TAG_THEMES.flatMap((theme) => theme.slugs));
  const themes: NewsTagTheme[] = [
    ...NEWS_TAG_THEMES.map((theme) => ({ title: theme.title, slugs: theme.slugs.filter((s) => available.has(s)) })),
    { title: OTHER_THEME, slugs: [...available].filter((s) => !mapped.has(s)) },
  ];

  const q = normalize(query);
  return themes
    .map(({ title, slugs: themeSlugs }) => ({
      title,
      slugs: (q && !normalize(title).includes(q) ? themeSlugs.filter((s) => s.includes(q)) : themeSlugs)
        .slice()
        .sort((a, b) => a.localeCompare(b)),
    }))
    .filter((theme) => theme.slugs.length > 0);
}
