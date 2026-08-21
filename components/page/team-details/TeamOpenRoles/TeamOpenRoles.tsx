'use client';

import { useToggle } from 'react-use';

import type { IJobTeamGroup } from '@/types/jobs.types';
import { getJobDate } from '@/utils/jobs.utils';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { useCurrentUserStore } from '@/services/auth/store';

import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';

// The job board's row, unchanged. A team's open roles must not become a second
// density of the same thing — the only differences here are how many show at once
// and the `source` the row reports.
import { ReferRoleRow } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow';

import s from './TeamOpenRoles.module.scss';

/** Collapsed height. Two rows read as a sample; the count in the header carries the rest. */
const ROLES_SHOWN = 2;

interface TeamOpenRolesProps {
  group: IJobTeamGroup;
}

/**
 * "Open roles" — who the team is looking for, sitting directly under Members
 * (who's already there). The same axis in two tenses.
 *
 * **No empty state.** Most teams have no open roles, and a permanent "No open roles"
 * block would charge every team profile for a fact about a few. The section renders or
 * it doesn't, the way the profile already gates IRL Contributions and the news rail.
 * The caller decides — see `page.tsx`, which also verifies the group belongs to this
 * team before rendering at all.
 *
 * **No link out to /jobs.** That destination is every team's board, not this team's, so
 * the label would misname where it goes. The section answers in place, and so does its
 * expander.
 */
export function TeamOpenRoles({ group }: TeamOpenRolesProps) {
  const [expanded, toggleExpanded] = useToggle(false);
  const analytics = useJobsAnalytics();
  const teamAnalytics = useTeamAnalytics();
  const currentUser = useCurrentUserStore((state) => state.currentUser);

  const { team } = group;

  // The API returns a group's roles in `uid` order — arbitrary. On the board that's
  // masked because *teams* are ordered by recency, but a single team's list would
  // scatter the "New" badges and relative times. Sort by the date the row displays.
  const roles = [...group.roles].sort((a, b) => Date.parse(getJobDate(b)) - Date.parse(getJobDate(a)));

  if (!roles.length) return null;

  const visible = expanded ? roles : roles.slice(0, ROLES_SHOWN);

  return (
    <DetailsSection>
      {/* "roles", not "jobs" — the board's own count block reads "N open roles";
          "Jobs" is only the name of the page you'd land on. One count source for both
          the heading and the expander, so the two can never disagree. */}
      <DetailsSectionHeader title={`Open roles (${roles.length})`} />

      <div className={s.list}>
        {visible.map((role, index) => (
          <ReferRoleRow
            key={role.uid}
            role={role}
            teamId={team.uid}
            teamName={team.name}
            currentUser={currentUser}
            source="team-profile"
            onClick={() => {
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
            }}
          />
        ))}
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
}
