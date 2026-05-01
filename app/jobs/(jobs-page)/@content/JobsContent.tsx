'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InfiniteScroll from 'react-infinite-scroll-component';
import type { IUserInfo } from '@/types/shared.types';
import type { IJobAlertFilterState } from '@/types/job-alerts.types';
import type { JobsSortKey } from '@/types/jobs.types';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { useInfiniteJobsList } from '@/services/jobs/hooks/useJobsQueries';
import { useJobsParamsUpdater } from '@/services/jobs/hooks/useJobsParamsUpdater';
import { useCreateJobAlert } from '@/services/job-alerts/hooks/useCreateJobAlert';
import { useJobAlertMatch } from '@/services/job-alerts/hooks/useJobAlertMatch';
import { PENDING_SAVE_STORAGE_KEY } from '@/services/job-alerts/constants';
import { filterStateFromURL } from '@/utils/jobs.utils';
import {
  jobAlertFilterStateFromURL,
  hasActiveFilters,
  filterStateToURLSearchParams,
} from '@/utils/job-alerts.utils';
import { SortDropdown } from '@/components/common/filters/SortDropdown/SortDropdown';
import { CardsLoader } from '@/components/core/loaders/CardsLoader';
import { ContentPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout/ContentPanelSkeletonLoader';
import { toast } from '@/components/core/ToastContainer';
import Error from '@/components/core/error';
import TeamGroupCard from '@/components/page/jobs/TeamGroupCard';
import JobAlertBanner from '@/components/page/jobs/JobAlertBanner/JobAlertBanner';
import JobAlertEmptyState from '@/components/page/jobs/JobAlertEmptyState/JobAlertEmptyState';
import JobAlertIndicator from '@/components/page/jobs/JobAlertIndicator/JobAlertIndicator';

import JobsMobileFilters from '@/components/page/jobs/JobsMobileFilters';
import s from './JobsContent.module.scss';

const SORT_OPTIONS = [
  { value: 'company_az', label: 'A-Z (Ascending)' },
  { value: 'newest', label: 'Newest' },
] as const;

interface JobsContentProps {
  userInfo: IUserInfo | undefined;
  isLoggedIn: boolean;
}

export default function JobsContent({ userInfo, isLoggedIn }: JobsContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setParam } = useJobsParamsUpdater();
  const analytics = useJobsAnalytics();
  const createMutation = useCreateJobAlert();
  const { groups, totalGroups, totalRoles, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteJobsList();
  const pendingSaveHandled = useRef(false);
  const autoApplyHandled = useRef(false);

  const alertFilterState = useMemo(() => jobAlertFilterStateFromURL(searchParams), [searchParams]);
  const hasFilters = hasActiveFilters(alertFilterState);
  const { userAlert, filtersMatchAlert } = useJobAlertMatch(alertFilterState, isLoggedIn);

  // Auto-apply the user's saved job alert filters on /jobs landing.
  // Done client-side (not server-side via redirect()) because Next.js parallel routes
  // (@content + @filters) don't reliably propagate redirects from a slot to the parent URL.
  useEffect(() => {
    if (autoApplyHandled.current) return;
    if (!isLoggedIn) return;
    if (hasFilters) return;
    if (!userAlert) return;
    autoApplyHandled.current = true;
    const qs = filterStateToURLSearchParams(userAlert.filterState).toString();
    if (qs) router.replace(`/jobs?${qs}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userAlert, hasFilters]);

  // Anonymous "Set job alert" → login → land here. Replay the pending filterState as a create.
  useEffect(() => {
    if (pendingSaveHandled.current) return;
    if (!isLoggedIn) return;

    let pendingFilterState = null as IJobAlertFilterState | null;
    try {
      const raw = window.sessionStorage.getItem(PENDING_SAVE_STORAGE_KEY);
      if (raw) {
        pendingFilterState = JSON.parse(raw) as IJobAlertFilterState;
        window.sessionStorage.removeItem(PENDING_SAVE_STORAGE_KEY);
      }
    } catch {
      // ignore parse / storage errors
    }
    if (!pendingFilterState) return;

    pendingSaveHandled.current = true;
    // Suppress auto-apply once we own this user's URL state via the pending create.
    autoApplyHandled.current = true;
    (async () => {
      const result = await createMutation.mutateAsync({ filterState: pendingFilterState! });
      if (result.ok) {
        const qs = filterStateToURLSearchParams(result.alert.filterState).toString();
        if (qs) router.replace(`/jobs?${qs}`);
        toast.success("Job alert set. We'll email you when new roles match.");
        analytics.onJobAlertSet({
          alert_id: result.alert.uid,
          filter_state: pendingFilterState as unknown as Record<string, unknown>,
          auth_required: true,
        });
      } else if ('conflict' in result && result.conflict) {
        analytics.onJobAlertConflict({ existing_alert_id: result.conflict.existingAlertUid });
        toast.error(result.conflict.message);
      } else if ('error' in result && result.error) {
        toast.error(result.error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

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
  // Only show the full-page skeleton on the very first load. During URL transitions,
  // keepPreviousData makes `groups` populated; we should keep rendering the page so
  // the user doesn't see a blank screen between filter changes (e.g. Clear).
  if (isLoading && groups.length === 0) return <ContentPanelSkeletonLoader />;

  const onSort = (value: string) => {
    setParam('sort', value === 'newest' ? null : value);
    analytics.onJobsSortChanged({ sort_key: value, result_count: totalRoles });
  };

  const filterState = filterStateFromURL(searchParams);
  const showIndicator = Boolean(userAlert && hasFilters && filtersMatchAlert);

  return (
    <div className={s.root}>
      <div className={s.mobileHeader}>
        <h1 className={s.title}>
          Job Board{' '}
          <span className={s.titleCount}>
            ({totalRoles} {totalRoles === 1 ? 'role' : 'roles'} across {totalGroups}{' '}
            {totalGroups === 1 ? 'team' : 'teams'})
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
              {totalGroups === 1 ? 'team' : 'teams'})
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

      {showIndicator && userAlert && <JobAlertIndicator alertName={userAlert.name} />}

      {hasFilters && groups.length > 0 && (
        <JobAlertBanner filterState={alertFilterState} resultCount={totalRoles} isLoggedIn={isLoggedIn} />
      )}

      {groups.length === 0 ? (
        <JobAlertEmptyState filterState={alertFilterState} isLoggedIn={isLoggedIn} />
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
