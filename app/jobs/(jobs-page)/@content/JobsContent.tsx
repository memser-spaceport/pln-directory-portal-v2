'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import InfiniteScroll from 'react-infinite-scroll-component';
import type { IUserInfo } from '@/types/shared.types';
import type { JobsSortKey } from '@/types/jobs.types';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { useInfiniteJobsList } from '@/services/jobs/hooks/useJobsQueries';
import { useJobsParamsUpdater } from '@/services/jobs/hooks/useJobsParamsUpdater';
import { filterStateFromURL } from '@/utils/jobs.utils';
import { SortDropdown } from '@/components/common/filters/SortDropdown/SortDropdown';
import { CardsLoader } from '@/components/core/loaders/CardsLoader';
import { ContentPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout/ContentPanelSkeletonLoader';
import Error from '@/components/core/error';
import EmptyResult from '@/components/core/empty-result';
import TeamGroupCard from '@/components/page/jobs/TeamGroupCard';
import JobsMobileFilters from '@/components/page/jobs/JobsMobileFilters';
import s from './JobsContent.module.scss';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'company_az', label: 'Company A–Z' },
] as const;

interface JobsContentProps {
  userInfo: IUserInfo | undefined;
  isLoggedIn: boolean;
}

export default function JobsContent({ userInfo, isLoggedIn }: JobsContentProps) {
  const searchParams = useSearchParams();
  const { setParam } = useJobsParamsUpdater();
  const analytics = useJobsAnalytics();
  const {
    groups,
    totalGroups,
    totalRoles,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteJobsList();

  const sort = (searchParams.get('sort') as JobsSortKey) ?? 'newest';

  const lastFiredParams = useRef<string | null>(null);
  const paramsKey = searchParams.toString();
  useEffect(() => {
    if (isLoading || isError) return;
    if (lastFiredParams.current === paramsKey) return;
    lastFiredParams.current = paramsKey;
    analytics.onJobsPageViewed({
      result_count: totalRoles,
      filter_state: filterStateFromURL(searchParams),
    });
  }, [isLoading, isError, paramsKey, totalRoles, searchParams, analytics]);

  if (isError) return <Error />;
  if (isLoading) return <ContentPanelSkeletonLoader />;

  const onSort = (value: string) => {
    setParam('sort', value === 'newest' ? null : value);
    analytics.onJobsSortChanged({ sort_key: value, result_count: totalRoles });
  };

  const filterState = filterStateFromURL(searchParams);

  return (
    <div className={s.root}>
      <div className={s.mobileHeader}>
        <h1 className={s.title}>
          Job Board{' '}
          <span className={s.titleCount}>
            ({totalRoles} {totalRoles === 1 ? 'role' : 'roles'} across {totalGroups}{' '}
            {totalGroups === 1 ? 'company' : 'companies'})
          </span>
        </h1>
      </div>
      <div className={s.mobileFilters}>
        <JobsMobileFilters />
      </div>
      <div className={s.toolbar}>
        <div className={s.titleGroup}>
          <h1 className={s.title}>
            Job Board{' '}
            <span className={s.titleCount}>
              ({totalRoles} {totalRoles === 1 ? 'role' : 'roles'} across {totalGroups}{' '}
              {totalGroups === 1 ? 'company' : 'companies'})
            </span>
          </h1>
        </div>
        <SortDropdown
          options={SORT_OPTIONS as unknown as Array<{ value: string; label: React.ReactNode }>}
          currentSort={sort}
          onSortChange={onSort}
          sortByLabel="Sort by:"
        />
      </div>

      {groups.length === 0 ? (
        <EmptyResult isLoggedIn={isLoggedIn} />
      ) : (
        <InfiniteScroll
          scrollableTarget="body"
          loader={null}
          hasMore={hasNextPage ?? false}
          dataLength={groups.length}
          next={fetchNextPage}
          style={{ overflow: 'unset' }}
        >
          <div className={s.list}>
            {groups.map((group, groupIndex) => (
              <TeamGroupCard
                key={group.team.uid}
                group={group}
                onRoleClick={(role, indexInGroup) => {
                  analytics.onJobClicked({
                    job_id: role.uid,
                    team_id: group.team.uid,
                    team_name: group.team.name,
                    role_title: role.roleTitle,
                    role_category: role.roleCategory,
                    seniority: role.seniority,
                    focus_areas: group.team.focusAreas,
                    position_in_list: positionInList(groups, groupIndex, indexInGroup),
                    filter_state: filterState,
                  });
                }}
              />
            ))}
            {isFetchingNextPage && <CardsLoader />}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
}

function positionInList(
  groups: ReturnType<typeof useInfiniteJobsList>['groups'],
  groupIndex: number,
  indexInGroup: number,
): number {
  let pos = 0;
  for (let i = 0; i < groupIndex; i++) pos += groups[i].roles.length;
  return pos + indexInGroup;
}
