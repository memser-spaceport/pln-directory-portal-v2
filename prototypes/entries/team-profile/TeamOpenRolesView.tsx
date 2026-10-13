'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';

import type { ListingMeta } from '../job-board/listings';

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
import { RoleCandidates } from './RoleCandidates';
import type { RoleCandidate, RoleSuggested } from './mocks';
import type { CandidatesTab } from './TeamCandidatesPage';
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
   * Opens the role's in-app description — the board's apply flow drawer, on its
   * reading step. With it the row becomes the press and wears the board's
   * chevron; without it the row falls back to the link out it used to be.
   *
   * See the note on the component for why this stopped being optional in
   * practice: a role read from its team's page and the same role read from the
   * board must be the same job to apply to.
   */
  onViewJob?: (role: IJobRole) => void;
  /** Roles this viewer has kept. Drawn as the filled bookmark. */
  savedRoleUids?: Set<string>;
  /** Present = the row offers Save. The list it lands in is the board's Saved
   *  tab — one kept set across the two surfaces, not a second one here. */
  onToggleSave?: (role: IJobRole) => void;
  /** Roles this viewer has already applied to, and when: the row reports it in
   *  the clock instead of offering the job again. */
  appliedRoleUids?: Set<string>;
  appliedAtByRole?: Map<string, string>;
  /**
   * Present for the viewer `submitHref` is for: these listings are this team's
   * own.
   *
   * **No owner's controls on the row.** The rows carried the board's ⋯ for a
   * while — status, `Mark inactive` / `Bring back`, Delete, with the reader's
   * presses folded in beside them — and that came off: this is the page
   * everyone reads, so the row stays the row everyone reads, and managing
   * lives on the board where the owner's ⋯ still is. What the team's own view
   * adds here is the *candidates*, which exist nowhere else.
   *
   * The card is still the owner's: the drawer the row opens carries the
   * listing's switch in its footer instead of Apply, so taking a role down
   * from this page is one press deeper rather than gone.
   */
  owner?: {
    /** Drives the row's status pill — a listing that isn't live says so. */
    metaFor: (roleUid: string) => ListingMeta | undefined;
    /**
     * Who has applied to each listing. Rendered under the row, on this page —
     * a founder is not expected to visit the board, so the candidates come to
     * the section rather than the section sending them there. See
     * `RoleCandidates`.
     */
    candidatesFor: (roleUid: string) => RoleCandidate[];
    /** Members suggested for each listing — the count line's second clause. */
    suggestedFor?: (roleUid: string) => RoleSuggested[];
    /** The count line's press: the team's candidates page, opened on this role (and tab). */
    openCandidates: (roleUid: string, tab?: CandidatesTab) => void;
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
 * **The row is the press, and it opens the same job the board opens.** This
 * section is where the row's action ranking was first argued — once you're on a
 * team's profile you have already chosen the team, so applying is the point of
 * the row and referring someone else is the sideline. That ranking stands and
 * the board has since adopted it everywhere. What changed is the *destination*,
 * and it changed on the board first: Apply moved into the flow drawer's footer,
 * where it sends your profile in one press, and the row's own button became a
 * chevron because a title, a seniority and a location are not enough to decide
 * with.
 *
 * This section kept the old shape for a while — a filled **Apply** that was a
 * plain link to the team's careers page — which left the same role with two
 * different applications depending on where it was found. The team's own page
 * was the weaker of the two doors to its own roles, and the tell was one line
 * up in this very section: the owner's candidates count can only count in-app
 * applications, so the reader's Apply here produced candidates the owner's own
 * section could not show them. The row now takes `onViewJob` and the surfaces
 * agree.
 *
 * The external posting is not lost — it is the drawer's masthead link
 * (`Original posting`), the same place the board keeps it.
 */
export function TeamOpenRolesView({
  group,
  submitHref,
  onViewJob,
  savedRoleUids,
  onToggleSave,
  appliedRoleUids,
  appliedAtByRole,
  owner,
}: TeamOpenRolesViewProps) {
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
            const meta = owner?.metaFor(role.uid);
            const candidates = owner?.candidatesFor(role.uid) ?? [];
            return (
              /* The row and its candidates share one card: `.roleBlock` is the
                 row's own grey and radius, so a role with nobody applied renders
                 exactly as before, and one with candidates grows a footer inside
                 the same shape instead of a second card under it. */
              <div key={role.uid} className={l.roleBlock}>
                <JobReferRoleRow
                  role={role}
                  teamId={group!.team.uid}
                  teamName={group!.team.name}
                  team={group!.team}
                  source="team-profile"
                  onViewJob={onViewJob}
                  /* No `savedAt` here: this is the team's open list, not a saved
                     list, so the clock keeps the posting's age — the number that
                     decides anything. Same rule the open board follows. */
                  saved={savedRoleUids?.has(role.uid) ?? false}
                  onToggleSave={onToggleSave ? () => onToggleSave(role) : undefined}
                  applied={appliedRoleUids?.has(role.uid) ?? false}
                  appliedAt={appliedAtByRole?.get(role.uid)}
                  /* Yours, but drawn as everyone's: the pill and no "New",
                     and no ⋯ — see `owner` above. */
                  ownListing={meta}
                />
                {owner && (
                  <RoleCandidates
                    candidates={candidates}
                    /* A listing that is not live has nobody to invite. */
                    suggested={meta && meta.status !== 'live' ? [] : owner.suggestedFor?.(role.uid)}
                    onOpen={(tab) => owner.openCandidates(role.uid, tab)}
                  />
                )}
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
