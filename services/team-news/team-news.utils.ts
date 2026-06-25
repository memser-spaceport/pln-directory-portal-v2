import type { ITeamNewsByTeamResponse } from '@/types/team-news.types';

export function hasTeamNewsItems(response: ITeamNewsByTeamResponse | null | undefined): boolean {
  return (response?.total ?? 0) > 0;
}

export function getTeamNewsByTeamNextPageParam(
  lastPage: ITeamNewsByTeamResponse,
): number | undefined {
  const totalPages = Math.ceil(lastPage.total / lastPage.limit);
  return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
}
