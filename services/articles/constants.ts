export enum ArticlesQueryKeys {
  ARTICLES_LIST = 'articles-list',
}

export const ARTICLES_FETCH_LIMIT = 100;

export const ARTICLE_CATEGORIES = [
  'Legal & Finance',
  'Fundraising & Investors',
  'Hiring & Team Building',
  'AI & Machine Learning',
  'Product & Engineering',
  'Marketing & Growth',
  'Operations & Strategy',
  'Web3 & Decentralization',
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];
