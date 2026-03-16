import { IDeal, IDealsListResponse, IDealFilterValues, IDealsSearchParams } from '@/types/deals.types';
import { MOCK_DEALS } from './mock-data';
import { DEALS_PER_PAGE, DEAL_CATEGORY_LABELS, DEAL_AUDIENCE_LABELS } from './constants';

function filterDeals(deals: IDeal[], params: IDealsSearchParams): IDeal[] {
  let filtered = [...deals];

  // Search by title/description
  if (params.q) {
    const query = params.q.toLowerCase();
    filtered = filtered.filter(
      (deal) => deal.title.toLowerCase().includes(query) || deal.description.toLowerCase().includes(query)
    );
  }

  // Filter by categories
  if (params.categories) {
    const selectedCategories = params.categories.split(',');
    filtered = filtered.filter((deal) => deal.categories.some((cat) => selectedCategories.includes(cat)));
  }

  // Filter by audience
  if (params.audience) {
    const selectedAudiences = params.audience.split(',');
    filtered = filtered.filter((deal) => deal.audience.some((aud) => selectedAudiences.includes(aud)));
  }

  return filtered;
}

function sortDeals(deals: IDeal[], sort?: string): IDeal[] {
  const sorted = [...deals];
  switch (sort) {
    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function getDeals(params: IDealsSearchParams): Promise<IDealsListResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const filtered = filterDeals(MOCK_DEALS, params);
  const sorted = sortDeals(filtered, params.sort);

  const page = parseInt(params.page || '1', 10);
  const end = page * DEALS_PER_PAGE;
  const paginated = sorted.slice(0, end);

  return {
    deals: paginated,
    totalItems: sorted.length,
    hasMore: end < sorted.length,
  };
}

export async function getDealById(id: string): Promise<IDeal | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_DEALS.find((deal) => deal.id === id) || null;
}

/**
 * Check if the current user has access to the Deals page.
 * Mock: always returns true. Replace with real API call when ready.
 */
export async function checkDealsAccess(): Promise<boolean> {
  // TODO: Replace with real API call, e.g.:
  // const response = await customFetch(`${process.env.DIRECTORY_API_URL}/v1/deals/access`);
  // return response?.hasAccess ?? false;
  await new Promise((resolve) => setTimeout(resolve, 100));
  return true;
}

export async function getDealFilterValues(): Promise<IDealFilterValues> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const categoryMap = new Map<string, number>();
  const audienceMap = new Map<string, number>();

  MOCK_DEALS.forEach((deal) => {
    deal.categories.forEach((cat) => {
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    deal.audience.forEach((aud) => {
      audienceMap.set(aud, (audienceMap.get(aud) || 0) + 1);
    });
  });

  return {
    categories: Array.from(categoryMap.entries()).map(([value, count]) => ({
      value,
      label: DEAL_CATEGORY_LABELS[value] || value,
      count,
    })),
    audiences: Array.from(audienceMap.entries()).map(([value, count]) => ({
      value,
      label: DEAL_AUDIENCE_LABELS[value] || value,
      count,
    })),
  };
}
