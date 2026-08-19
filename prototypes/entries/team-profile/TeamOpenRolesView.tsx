'use client';

import { useState } from 'react';

import type { IJobTeamGroup } from '@/types/jobs.types';

import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';

// The role row is the job board's, unchanged — it already wraps production
// `ReferRoleRow.module.scss` 1:1. A team's open roles must not become a third
// density of the same thing.
import { JobReferRoleRow } from '../job-board/JobReferRoleRow';

import l from './TeamOpenRoles.module.scss';

/** Collapsed height. Two rows read as a sample; the count in the header carries the rest. */
const ROLES_SHOWN = 2;

interface TeamOpenRolesViewProps {
  group: IJobTeamGroup | null;
}

/**
 * "Open roles" — who the team is looking for, sitting directly under Members
 * (who's already there). The same axis in two tenses.
 *
 * **No empty state.** Most teams have no open roles, and a permanent "No open
 * roles" block would charge every team profile for a fact about a few. The
 * section renders or it doesn't, the way production gates IRL Contributions and
 * the news rail.
 *
 * **No link out to /jobs.** That destination is every team's board, not this
 * team's — `?team=` isn't consumed server-side — so the label would misname
 * where it goes. The section answers in place, and so does its expander.
 *
 * **Apply leads the row.** This section is where that ranking was first argued:
 * once you're on a team's profile you have already chosen the team, so applying
 * is the point of the row and should look like it, with referring someone else
 * as the sideline rather than its peer. The board has since agreed — the row
 * ranks its actions that way everywhere — so there is no prop to pass here any
 * more. What stays different is the destination: the board applies in-app, this
 * keeps Apply as a plain link out to the team's own posting.
 */
export function TeamOpenRolesView({ group }: TeamOpenRolesViewProps) {
  const [expanded, setExpanded] = useState(false);

  if (!group?.roles?.length) return null;

  const { roles, team, totalRoles } = group;
  const visible = expanded ? roles : roles.slice(0, ROLES_SHOWN);

  return (
    <DetailsSection>
      {/* "roles", not "jobs" — the board's own count block reads "N open roles";
          "Jobs" is only the name of the page you'd land on. */}
      <DetailsSectionHeader title={`Open roles (${totalRoles})`} />
      <div className={l.list}>
        {visible.map((role) => (
          <JobReferRoleRow
            key={role.uid}
            role={role}
            teamId={team.uid}
            teamName={team.name}
            source="team-profile"
            showMatch={false}
            // Applying is the point of the row once you've already chosen the
            // team, so it gets the primary button and Refer steps back.
            primaryApply
          />
        ))}
      </div>
      {roles.length > ROLES_SHOWN && (
        // Expands in place rather than opening a modal or leaving for the board:
        // this is a short list, and the reader came to the page for the team.
        <button type="button" className={l.viewAll} aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `View all ${roles.length} roles`}
        </button>
      )}
    </DetailsSection>
  );
}
