export type DealCategory =
  | 'hosting-infrastructure'
  | 'developer-tools'
  | 'design-collaboration'
  | 'analytics-monitoring'
  | 'security-compliance';

export type DealAudience = 'all-founders' | 'pl-funded-founders';

export interface IDeal {
  id: string;
  title: string;
  description: string;
  aboutHtml?: string;
  redemptionHtml?: string;
  logoUrl: string;
  externalUrl: string;
  categories: DealCategory[];
  audience: DealAudience[];
  usersCount: number;
  issuesCount: number;
  createdAt: string;
}

export interface IDealsListResponse {
  deals: IDeal[];
  totalItems: number;
  hasMore: boolean;
}

export interface IDealFilterOption {
  value: string;
  label: string;
  count: number;
}

export interface IDealFilterValues {
  categories: IDealFilterOption[];
  audiences: IDealFilterOption[];
}

export interface IDealsSearchParams {
  q?: string;
  categories?: string;
  audience?: string;
  sort?: string;
  page?: string;
}

export interface IUserDealStatus {
  dealId: string;
  using: boolean;
}
