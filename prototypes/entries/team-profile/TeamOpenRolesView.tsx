'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

import type { IJobTeamGroup } from '@/types/jobs.types';

import type { ListingMeta, ListingStatus } from '../job-board/listings';

import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
  NoDataBlock,
} from '@/components/common/profile/DetailsSection';
// The section-header action, as production's Edit wears it: the DS link-style
// primary Button plus HeaderActionBtn's own icon/label row. Worn by a <Link>
// rather than the component, because this action leaves the page and
// `HeaderActionBtn` only takes an onClick — a button that navigates is a link
// with the middle-click and the status-bar URL taken away.
import btn from '@/components/common/Button/Button.module.scss';
import hab from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader/components/HeaderActionBtn/HeaderActionBtn.module.scss';

// The role row is the job board's, unchanged — it already wraps production
// `ReferRoleRow.module.scss` 1:1. A team's open roles must not become a third
// density of the same thing.
import { JobReferRoleRow } from '../job-board/JobReferRoleRow';

import { SubmitPlusIcon } from './icons';
import { RoleApplicants } from './RoleApplicants';
import type { RoleApplicant } from './mocks';
import l from './TeamOpenRoles.module.scss';

/** Collapsed height. Two rows read as a sample; the count in the header carries the rest. */
const ROLES_SHOWN = 2;

interface TeamOpenRolesViewProps {
  group: IJobTeamGroup | null;
  /**
   * Where **Submit a job** leads, for someone who may post for this team — the
   * board's form, opened on this team (`submitJobHref`). Absent for everyone
   * else, and then the section is exactly what it was: present when the team
   * is hiring, gone when it isn't.
   */
  submitHref?: string;
  /**
   * The owner's handles on each listing, for the same viewer `submitHref` is
   * for. Every row then carries its status, the switch and Delete — the
   * board's Manage row, on the team's own page — so taking a listing down or
   * removing it never needs the board, or the card, opened first.
   */
  manage?: {
    metaFor: (roleUid: string) => ListingMeta | undefined;
    onSetStatus: (roleUid: string, status: ListingStatus) => void;
    onDelete: (roleUid: string) => void;
    /**
     * Who has applied to each listing, for the same viewer. Rendered under the
     * row, on this page — a founder is not expected to visit the board, so the
     * applicants come to the section rather than the section sending them
     * there. See `RoleApplicants`.
     */
    applicantsFor: (roleUid: string) => RoleApplicant[];
    /** The count line's press: the team's applicants page, opened on this role. */
    openApplicants: (roleUid: string) => void;
  };
}

/**
 * "Open roles" — who the team is looking for, sitting directly under Members
 * (who's already there). The same axis in two tenses.
 *
 * **No empty state — for a reader.** Most teams have no open roles, and a
 * permanent "No open roles" block would charge every team profile for a fact
 * about a few. The section renders or it doesn't, the way production gates IRL
 * Contributions and the news rail.
 *
 * **One empty state — for the owner.** A lead or admin sees the section whether
 * or not the team is hiring, because it is where they post. This is the
 * profile's own rule for Asks and for the news rail: an empty state that
 * exists to hold an invitation goes to the people the invitation is for. The
 * door is the same control in both states — the header's action slot, where
 * every editable section on this page keeps its one action — rather than a
 * link when there are rows and a filled button when there are none. The body
 * under it is the page's ordinary "No X yet." block, not a second copy of the
 * door: one control, one slot, and a lead who has nothing listed reads the
 * sentence and looks up.
 *
 * **The door leads to the board.** The form lives there, modelled on Submit a
 * Deal, and this is a second way in rather than a second form: a lead's home
 * in this product is their team's profile — it is where they edit the team,
 * post its news and file its Asks — so the press that starts a listing belongs
 * here, and the thing it starts belongs where listings are reviewed and
 * managed. Same label as the board's own door, on purpose: a cross-surface
 * exit that reads differently per page is the drift that makes two doors
 * feel like two features.
 *
 * **No link out to /jobs for readers.** That destination is every team's board,
 * not this team's — `?team=` isn't consumed server-side — so the label would
 * misname where it goes. The section answers in place, and so does its expander.
 *
 * **Apply leads the row.** This section is where that ranking was first argued:
 * once you're on a team's profile you have already chosen the team, so applying
 * is the point of the row and should look like it, with referring someone else
 * as the sideline rather than its peer. The board has since agreed — the row
 * ranks its actions that way everywhere — so there is no prop to pass here any
 * more. What stays different is the destination: the board applies in-app, this
 * keeps Apply as a plain link out to the team's own posting.
 */
export function TeamOpenRolesView({ group, submitHref, manage }: TeamOpenRolesViewProps) {
  const [expanded, setExpanded] = useState(false);

  const roles = group?.roles ?? [];
  if (!roles.length && !submitHref) return null;

  const visible = expanded ? roles : roles.slice(0, ROLES_SHOWN);

  return (
    <DetailsSection>
      {/* "roles", not "jobs" — the board's own count block reads "N open roles";
          "Jobs" is only the name of the page you'd land on. No count when there
          are none, the way Members and Projects title their empty sections. */}
      <DetailsSectionHeader title={group?.totalRoles ? `Open roles (${group.totalRoles})` : 'Open roles'}>
        {submitHref && (
          <Link href={submitHref} className={clsx(btn.root, btn.medium, btn.link, btn.primary, hab.root)}>
            {/* The board's door's own plus, shared with Post news — see `icons.tsx`. */}
            <SubmitPlusIcon size={14} />
            Submit a job
          </Link>
        )}
      </DetailsSectionHeader>

      {roles.length ? (
        <div className={l.list}>
          {visible.map((role) => {
            const meta = manage?.metaFor(role.uid);
            const applicants = manage?.applicantsFor(role.uid) ?? [];
            return (
              /* The row and its applicants share one card: `.roleBlock` is the
                 row's own grey and radius, so a role with nobody applied renders
                 exactly as before, and one with applicants grows a footer inside
                 the same shape instead of a second card under it. */
              <div key={role.uid} className={l.roleBlock}>
                <JobReferRoleRow
                  role={role}
                  teamId={group!.team.uid}
                  teamName={group!.team.name}
                  team={group!.team}
                  source="team-profile"
                  manage={
                    manage && meta
                      ? {
                          meta,
                          onSetStatus: (status) => manage.onSetStatus(role.uid, status),
                          onDelete: () => manage.onDelete(role.uid),
                        }
                      : undefined
                  }
                />
                {manage && <RoleApplicants applicants={applicants} onOpen={() => manage.openApplicants(role.uid)} />}
              </div>
            );
          })}
        </div>
      ) : (
        <DetailsSectionGreyContentContainer>
          <NoDataBlock>No open roles yet.</NoDataBlock>
        </DetailsSectionGreyContentContainer>
      )}

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
