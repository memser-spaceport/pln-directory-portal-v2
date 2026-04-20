export enum ArticlesQueryKeys {
  ARTICLES_LIST = 'articles-list',
}

export const ARTICLES_FETCH_LIMIT = 100;

export const ARTICLE_CATEGORIES = ['Fundraising and Capital', 'Legal', 'Hiring'] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export const AVAILABLE_SCOPES = ['PLVS', 'PLCC'] as const;
export type ArticleScope = (typeof AVAILABLE_SCOPES)[number];

/** Default "Viewing as" scope when the user has multiple founder_guides.view scopes. */
export const DEFAULT_FOUNDER_GUIDES_VIEW_SCOPE: ArticleScope = 'PLVS';
export const SCOPE_LABELS: Record<string, string> = {
  PLVS: 'PLC PLVS Founder',
  PLCC: 'PLC Crypto Founder',
};
