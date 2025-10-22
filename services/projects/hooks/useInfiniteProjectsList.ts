import { useEffect } from 'react';
import { toast } from '@/components/core/ToastContainer';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ITEMS_PER_PAGE, TOAST_MESSAGES } from '@/utils/constants';
import { getProjectSelectOptions, getProjectsFiltersFromQuery } from '@/utils/projects.utils';
import { getAllProjects } from '@/app/actions/projects.actions';
import { ProjectsQueryKeys } from '@/services/projects/constants';
import { IFormatedTeamProject } from '@/types/teams.types';
import { ProjectsListQueryParams } from '@/services/projects/types';

async function infiniteFetcher(searchParams: ProjectsListQueryParams['searchParams'], page: number) {
  const filterFromQuery = getProjectsFiltersFromQuery(searchParams);
  const selectOpitons = getProjectSelectOptions(filterFromQuery);

  const projectsResponse = await getAllProjects(
    {
      ...selectOpitons,
      isDeleted: false,
      select: 'uid,name,tagline,logo.url,description,lookingForFunding,maintainingTeam.name,maintainingTeam.logo.url',
    },
    page,
    ITEMS_PER_PAGE,
  );

  return { items: projectsResponse?.data?.formattedData, total: projectsResponse?.data?.totalProjects };
}

type QueryData = {
  total?: number;
  items?: IFormatedTeamProject;
};

export function useInfiniteProjectsList(
  queryParams: ProjectsListQueryParams,
  {
    initialData,
  }: {
    initialData: QueryData;
  },
) {
  const queryClient = useQueryClient();

  const {
    isRefetching,
    data,
    error,
    isError,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: [ProjectsQueryKeys.GET_PROJECTS_LIST, queryParams.searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      return infiniteFetcher(queryParams.searchParams, pageParam);
    },
    getNextPageParam: (data, allPages, lastPageParam) => {
      return data.items.length < ITEMS_PER_PAGE ? undefined : lastPageParam + 1;
    },
    initialData: {
      pages: [{ items: initialData.items, total: initialData.total }],
      pageParams: [1],
    },
  });

  useEffect(() => {
    if (!hasNextPage) return;

    queryClient.fetchInfiniteQuery({
      queryKey: [ProjectsQueryKeys.GET_PROJECTS_LIST, queryParams.searchParams],
      queryFn: ({ pageParam = 2 }) => {
        return infiniteFetcher(queryParams.searchParams, pageParam);
      },
      initialPageParam: 2,
      getNextPageParam: (data: unknown, allPages: unknown, lastPageParam: number) => {
        return lastPageParam + 2;
      },
    });

    queryClient.fetchInfiniteQuery({
      queryKey: [ProjectsQueryKeys.GET_PROJECTS_LIST, queryParams.searchParams],
      queryFn: ({ pageParam = 3 }) => {
        return infiniteFetcher(queryParams.searchParams, pageParam);
      },
      initialPageParam: 3,
      getNextPageParam: (data: unknown, allPages: unknown, lastPageParam: number) => {
        return lastPageParam + 3;
      },
    });
  }, [hasNextPage, queryParams.searchParams, queryClient]);

  useEffect(() => {
    if (isError && error) {
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
    }
  }, [error, isError]);

  const items: IFormatedTeamProject[] = data?.pages?.flatMap((page) => page.items) ?? [];

  return {
    data: items,
    error,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    status,
    refetch,
    isRefetching,
  };
}
