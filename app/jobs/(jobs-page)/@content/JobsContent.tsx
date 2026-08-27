'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InfiniteScroll from 'react-infinite-scroll-component';
import type { IUserInfo } from '@/types/shared.types';
import type { IJobAlert, IJobAlertFilterState } from '@/types/job-alerts.types';
import type { IJobRole, IJobTeamGroup, JobsSortKey } from '@/types/jobs.types';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { useInfiniteJobsList } from '@/services/jobs/hooks/useJobsQueries';
import { useJobsParamsUpdater } from '@/services/jobs/hooks/useJobsParamsUpdater';
import { useCreateJobAlert } from '@/services/job-alerts/hooks/useCreateJobAlert';
import { useJobAlertMatch } from '@/services/job-alerts/hooks/useJobAlertMatch';
import { PENDING_SAVE_STORAGE_KEY } from '@/services/job-alerts/constants';
import { filterStateFromURL } from '@/utils/jobs.utils';
import { jobAlertFilterStateFromURL, hasActiveFilters, filterStateToURLSearchParams } from '@/utils/job-alerts.utils';
import { SortDropdown } from '@/components/common/filters/SortDropdown/SortDropdown';
import { JOBS_SORT_OPTIONS, SHOW_JOB_BOARD_APPLY, SHOW_JOB_DETAIL } from '@/services/jobs/constants';
import { PENDING_APPLY_PARAM, stripPendingApplyFromUrl, withPendingApply } from '@/services/jobs/job-apply-resume';
import { JOB_DETAIL_PARAM } from '@/services/jobs/job-detail-link';
import { useJobBoardViewer } from '@/components/page/jobs/hooks/useJobBoardViewer';
import { useJobApplyFlow } from '@/components/page/jobs/hooks/useJobApplyFlow';
import { useJobDetailDeepLink } from '@/components/page/jobs/hooks/useJobDetailDeepLink';
import { JobBoardBanner } from '@/components/page/jobs/JobBoardBanner/JobBoardBanner';
import { JobApplyFlowController } from '@/components/page/jobs/JobApplyFlowController/JobApplyFlowController';
import type { RowApplyProps } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow';
import { CardsLoader } from '@/components/core/loaders/CardsLoader';
import { ContentPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout/ContentPanelSkeletonLoader';
import { toast } from '@/components/core/ToastContainer';
import Error from '@/components/core/error';
import TeamGroupCard from '@/components/page/jobs/TeamGroupCard';
import { JobAlertBanner } from '@/components/page/jobs/JobAlertBanner';
import JobAlertEmptyState from '@/components/page/jobs/JobAlertEmptyState/JobAlertEmptyState';
import { JobAlertIndicator } from '@/components/page/jobs/JobAlertIndicator';

import JobsMobileFilters from '@/components/page/jobs/JobsMobileFilters';
import { TeamNewsModal } from '@/components/page/team-details/TeamNews';
import { useTeamNewsCounts } from '@/services/team-news/hooks/useTeamNewsCounts';
import { SHOW_TEAM_NEWS_COUNT_CHIP } from '@/services/team-news/constants';
import { useIsMobile } from '@/hooks/useIsMobile';
import s from './JobsContent.module.scss';
import { useLoginRedirect } from '@/components/core/login/utils';

// Flip to true to simulate a logged-in user with a saved alert during local dev
const DEV_MOCK_ALERT = false;
const MOCK_USER_ALERT: IJobAlert = {
  uid: 'mock-alert-dev-123',
  name: 'Mock Dev Alert',
  filterState: {
    roleCategory: ['Engineering'],
    seniority: ['Senior'],
    focus: [],
    location: [],
    workMode: [],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface JobsContentProps {
  userInfo: IUserInfo | undefined;
  isLoggedIn: boolean;
}

export default function JobsContent({ userInfo, isLoggedIn }: JobsContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const goToLogin = useLoginRedirect();
  const { setParam } = useJobsParamsUpdater();
  const analytics = useJobsAnalytics();
  const createMutation = useCreateJobAlert();
  const { groups, totalGroups, totalRoles, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteJobsList();
  const pendingSaveHandled = useRef(false);
  const autoApplyHandled = useRef(false);

  const alertFilterState = useMemo(() => jobAlertFilterStateFromURL(searchParams), [searchParams]);
  const hasFilters = hasActiveFilters(alertFilterState);
  const { userAlert: fetchedAlert, filtersMatchAlert } = useJobAlertMatch(alertFilterState, isLoggedIn);
  const userAlert = DEV_MOCK_ALERT ? MOCK_USER_ALERT : fetchedAlert;
  const [indicatorDismissed, setIndicatorDismissed] = useState(false);

  // Counts behind the "N new posts" chips. Here the identifier is `team.uid`,
  // where the teams grid uses `team.id` — same backend value, different field
  // name on each surface's view model.
  const newsTeamUids = useMemo(() => groups.map((group) => group.team.uid).filter(Boolean), [groups]);
  useTeamNewsCounts({ uids: newsTeamUids, enabled: SHOW_TEAM_NEWS_COUNT_CHIP });

  /* In-app Apply. `SHOW_JOB_BOARD_APPLY` is imported ONLY here on this page —
     it reaches the hooks as `enabled` (flag off ⇒ zero requests, zero storage
     touches) and the leaf components as prop absence (flag off ⇒ rows render
     byte-identical to production today). */
  const boardViewer = useJobBoardViewer({ isLoggedIn, userInfo, enabled: SHOW_JOB_BOARD_APPLY });
  const applyFlow = useJobApplyFlow({
    viewer: boardViewer.viewer,
    verdict: boardViewer.verdict,
    profileComplete: boardViewer.profileComplete,
    refreshVerdict: boardViewer.refreshVerdict,
    source: 'job-board',
  });
  const flow = useJobDetailDeepLink({
    enabled: SHOW_JOB_BOARD_APPLY && SHOW_JOB_DETAIL,
    groups,
    isLoading,
    flow: applyFlow,
  });
  const applyProps: RowApplyProps | undefined = useMemo(
    () =>
      SHOW_JOB_BOARD_APPLY && boardViewer.viewer !== 'rejected'
        ? {
            onApply: flow.onApply,
            memberUid: boardViewer.memberUid,
            /* Literal-first, so the bundler folds the branch: flag off and the
               rows keep their direct Apply, with `onViewJob` absent rather than
               present-and-ignored. Nested inside the apply flag because the
               drawer's whole footer is the apply hand-off. */
            ...(SHOW_JOB_DETAIL ? { onViewJob: flow.onViewJob } : {}),
          }
        : undefined,
    /* `flow` is `useJobDetailDeepLink`'s wrapper around `applyFlow` — the rows
       must call the wrapped `onViewJob` so opening a description writes `?job=`.
       The narrowing is ours: `isLoggedIn` and `boardViewer.verdict` left this
       list when the approval gate did, since they were only ever read to compute
       `externalApply`, which no longer exists. */
    [boardViewer.viewer, boardViewer.memberUid, flow.onApply, flow.onViewJob],
  );
  /* The banner's "Sign in". Signing in never resumes an application — only
     signing up does — so any `applyTo` left in the URL by an abandoned
     sign-up is dropped here rather than inherited through the round trip. */
  const pushLogin = useCallback(() => {
    const search = withPendingApply(window.location.search, undefined);
    goToLogin({ returnTo: `${window.location.pathname}${search}` });
  }, [goToLogin]);

  /* Coming back from the Privy round trip: pick the application back up where
     it was interrupted. The role uid travels in the URL (see
     `job-apply-resume`) because the login path clears localStorage on its way
     through and sessionStorage did not reliably survive it.

     Gated on the viewer having actually settled — resuming against a
     half-derived state would open the drawer at someone with nothing to fill
     in — and on the list having loaded, since the uid has to be re-resolved
     against what the board is showing now. */
  const applyResumeHandled = useRef(false);
  useEffect(() => {
    if (!SHOW_JOB_BOARD_APPLY) return;
    if (applyResumeHandled.current) return;

    const roleUid = searchParams.get(PENDING_APPLY_PARAM);
    if (!roleUid) return;
    if (!isLoggedIn || boardViewer.viewer === 'resolving') return;
    if (isLoading) return;

    // Claimed before anything async runs, so a StrictMode double-invoke or a
    // re-render mid-resume can't run the flow twice. The parameter goes with
    // it: a one-time instruction must not replay on reload.
    applyResumeHandled.current = true;
    stripPendingApplyFromUrl();

    let resumed: { role: IJobRole; teamId: string; teamName: string } | null = null;
    for (const group of groups) {
      const role = group.roles.find((r) => r.uid === roleUid);
      if (role) {
        resumed = { role, teamId: group.team.uid, teamName: group.team.name };
        break;
      }
    }

    if (resumed) {
      flow.onApply(resumed, 'resume');
    } else {
      /* The role closed, or the filters no longer show it. The profile is
         still the thing standing between them and applying, so the drawer
         opens without naming a role rather than resuming nothing at all. */
      flow.onUpdateProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, boardViewer.viewer, isLoading, groups]);

  /* ONE stable callback for every card — `TeamGroupCard` is memoized, and a
     closure minted per group re-renders every scrolled-in card on each host
     state change (every modal open/close, every submit). */
  const onRoleClick = useCallback(
    (role: IJobRole, indexInGroup: number, group: IJobTeamGroup, groupIndex: number) => {
      analytics.onJobClicked({
        job_id: role.uid,
        team_id: group.team.uid,
        team_name: group.team.name,
        role_title: role.roleTitle,
        role_category: role.roleCategory,
        seniority: role.seniority,
        focus_areas: group.team.focusAreas,
        position_in_list: positionInList(groups, groupIndex, indexInGroup),
        source: 'job-board',
        filter_state: filterStateFromURL(searchParams),
      });
    },
    [analytics, groups, searchParams],
  );

  // Which team's news is open over the board. Someone weighing a role hasn't
  // asked to leave the board to find out what a team has been up to.
  const [newsModal, setNewsModal] = useState<{ teamUid: string; teamName: string } | null>(null);
  const openTeamNews = useCallback((teamUid: string, teamName: string) => {
    setNewsModal({ teamUid, teamName });
  }, []);
  const closeTeamNews = useCallback(() => setNewsModal(null), []);
  const isNewsModalMobile = useIsMobile();

  // Auto-apply the user's saved job alert filters on /jobs landing.
  // Done client-side (not server-side via redirect()) because Next.js parallel routes
  // (@content + @filters) don't reliably propagate redirects from a slot to the parent URL.
  useEffect(() => {
    if (autoApplyHandled.current) return;
    if (!isLoggedIn) return;
    if (hasFilters) return;
    // A shared/emailed `?job=` is a destination. Applying saved filters here
    // would replace the URL and drop the drawer the link was meant to open.
    if (searchParams.get(JOB_DETAIL_PARAM)) {
      autoApplyHandled.current = true;
      return;
    }
    if (!userAlert) return;
    autoApplyHandled.current = true;
    const qs = filterStateToURLSearchParams(userAlert.filterState).toString();
    if (qs) router.replace(`/jobs?${qs}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userAlert, hasFilters, searchParams]);

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

  const showIndicator = Boolean(userAlert && hasFilters && filtersMatchAlert && !indicatorDismissed);

  return (
    <div className={s.root}>
      {/* The board's one apply-flow banner slot — first block in the column,
          above the page's own content, the same slot the home page gives its
          signed-out Welcome. Renders nothing for resolving/rejected/ready. */}
      {SHOW_JOB_BOARD_APPLY && (
        <JobBoardBanner
          viewer={boardViewer.viewer}
          roleCount={totalRoles}
          teamCount={totalGroups}
          filterState={alertFilterState}
          profileComplete={boardViewer.profileComplete}
          onSignIn={pushLogin}
          onSignUp={() => flow.onSignUp('banner')}
          onUpdateProfile={flow.onUpdateProfile}
        />
      )}
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
        <SortDropdown options={JOBS_SORT_OPTIONS} currentSort={sort} onSortChange={onSort} sortByLabel="Sort by:" />
      </div>

      {showIndicator && userAlert && (
        <JobAlertIndicator alert={userAlert} onDismiss={() => setIndicatorDismissed(true)} />
      )}

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
                groupIndex={groupIndex}
                onOpenTeamNews={openTeamNews}
                onRoleClick={onRoleClick}
                apply={applyProps}
              />
            ))}
            {isFetchingNextPage && <CardsLoader />}
          </div>
        </InfiniteScroll>
      )}

      {/* The apply-flow modal/drawer stack — outside the groups.length branch
          for the same reason the news modal is: a filter change mid-application
          must not yank an open modal. */}
      {SHOW_JOB_BOARD_APPLY && (
        <JobApplyFlowController
          flow={flow}
          viewer={boardViewer}
          isLoggedIn={isLoggedIn}
          userInfo={userInfo}
          source="job-board"
        />
      )}

      {/* Rendered outside the groups.length branch so an open modal survives the
          list emptying underneath it — a filter change while reading a team's
          news shouldn't yank the news away. */}
      {newsModal && (
        <TeamNewsModal
          isOpen
          focusUid={null}
          onClose={closeTeamNews}
          teamUid={newsModal.teamUid}
          teamName={newsModal.teamName}
          fullscreen={isNewsModalMobile}
          source="job-board-modal"
        />
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
