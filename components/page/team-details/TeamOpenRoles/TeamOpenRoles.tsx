'use client';

import { memo, useMemo } from 'react';
import { useToggle } from 'react-use';

import type { IJobTeamGroup } from '@/types/jobs.types';
import type { IUserInfo } from '@/types/shared.types';
import { getJobDate } from '@/utils/jobs.utils';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { useTeamAnalytics } from '@/analytics/teams.analytics';

import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';

// The job board's row, unchanged. A team's open roles must not become a second
// density of the same thing — the only differences here are how many show at once
// and the `source` the row reports.
import { ReferRoleRow, type RowApplyProps } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow';

import s from './TeamOpenRoles.module.scss';

/** Collapsed height. Two rows read as a sample; the count in the header carries the rest. */
const ROLES_SHOWN = 2;

interface TeamOpenRolesProps {
  group: IJobTeamGroup;
  /**
   * From the page's server props, not the client store. The drawer snapshots the
   * profile-reviewed tick once at mount, so a `memberUid` that arrives a beat
   * later re-asks a member a question they already answered — and the row and
   * the drawer would be deciding `canSeeOriginalPosting` from two sources.
   */
  userInfo: IUserInfo | undefined;
  /**
   * The in-app flow, or nothing. Absent, the rows render exactly as they did
   * before the flow existed: title and arrow out to the company's own posting.
   * The section never reads the feature flag — its host does.
   */
  apply?: RowApplyProps;
}

/**
 * "Open roles" — who the team is looking for, sitting directly under Members
 * (who's already there). The same axis in two tenses.
 *
 * **No empty state.** Most teams have no open roles, and a permanent "No open roles"
 * block would charge every team profile for a fact about a few. The section renders or
 * it doesn't, the way the profile already gates IRL Contributions and the news rail.
 * The caller decides — see `TeamOpenRolesSection`, and `page.tsx`, which verifies the
 * group belongs to this team before handing it over.
 *
 * **No link out to /jobs.** That destination is every team's board, not this team's, so
 * the label would misname where it goes. The section answers in place, and so does its
 * expander.
 *
 * **Presentational, and memoized.** The apply flow keeps the cover-letter draft in its
 * state, so every keystroke re-renders whoever owns it. That owner is the host above;
 * this list must not re-render with it, or typing a cover letter would re-render every
 * visible row — each one running an applied-map subscription and mounting a refer modal.
 */
export const TeamOpenRoles = memo(function TeamOpenRoles({ group, userInfo, apply }: TeamOpenRolesProps) {
  const [expanded, toggleExpanded] = useToggle(false);
  const analytics = useJobsAnalytics();
  const teamAnalytics = useTeamAnalytics();

  const { team } = group;

  // The API returns a group's roles in `uid` order — arbitrary. On the board that's
  // masked because *teams* are ordered by recency, but a single team's list would
  // scatter the "New" badges and relative times. Sort by the date the row displays.
  const roles = useMemo(
    () => [...group.roles].sort((a, b) => Date.parse(getJobDate(b)) - Date.parse(getJobDate(a))),
    [group.roles],
  );

  if (!roles.length) return null;

  const visible = expanded ? roles : roles.slice(0, ROLES_SHOWN);

  return (
    <DetailsSection>
      {/* "roles", not "jobs" — the board's own count block reads "N open roles";
          "Jobs" is only the name of the page you'd land on. One count source for both
          the heading and the expander, so the two can never disagree. */}
      <DetailsSectionHeader title={`Open roles (${roles.length})`} />

      <div className={s.list}>
        {visible.map((role, index) => {
          const trackClick = () => {
            analytics.onJobClicked({
              job_id: role.uid,
              team_id: team.uid,
              team_name: team.name,
              role_title: role.roleTitle,
              role_category: role.roleCategory,
              seniority: role.seniority,
              focus_areas: team.focusAreas,
              position_in_list: index,
              source: 'team-profile',
            });
          };

          /* `onClick` only ever reaches the row's outbound <a>. With the flow on,
             the title becomes a button and the arrow is gone, so it would never
             fire again — and `job-clicked` is this surface's only funnel event.
             The board has `jobs-page-viewed` and its own row click for a
             denominator; a team profile has neither, and the apply payload
             carries no `position_in_list`. So the View job press reports both:
             one event for "a role was opened from here, at this position", one
             for "the flow began". Exactly one of the two paths can fire. */
          const rowApply: RowApplyProps | undefined =
            apply && apply.onViewJob
              ? {
                  ...apply,
                  onViewJob: (target) => {
                    trackClick();
                    apply.onViewJob?.(target);
                  },
                }
              : apply;

          return (
            <ReferRoleRow
              key={role.uid}
              role={role}
              teamId={team.uid}
              teamName={team.name}
              team={team}
              currentUser={userInfo ?? null}
              source="team-profile"
              apply={rowApply}
              onClick={trackClick}
            />
          );
        })}
      </div>

      {roles.length > ROLES_SHOWN && (
        // Expands in place rather than opening a modal or leaving for the board: this is
        // a short list, and the reader came to the page for the team.
        <button
          type="button"
          className={s.viewAll}
          aria-expanded={expanded}
          onClick={() => {
            const nextExpanded = !expanded;
            teamAnalytics.onTeamDetailOpenRolesViewAllClicked({
              teamUid: team.uid,
              teamName: team.name,
              totalRoles: roles.length,
              expanded: nextExpanded,
            });
            toggleExpanded();
          }}
        >
          {expanded ? 'Show less' : `View all ${roles.length} roles`}
        </button>
      )}
    </DetailsSection>
  );
});
