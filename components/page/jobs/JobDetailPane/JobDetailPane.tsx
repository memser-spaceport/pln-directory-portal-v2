'use client';

import { useMemo, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

import { PAGE_ROUTES } from '@/utils/constants';
import { isBlankHtml, normalizeJobDescriptionHtml, sanitizeJobDescriptionHtml } from '@/utils/html';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';
import {
  formatRelativeDays,
  getJobDate,
  isNew,
  seniorityDisplayLabel,
  teamInitials,
  workplaceTypeDisplayLabel,
} from '@/utils/jobs.utils';

import { TagsList } from '@/components/common/profile/TagsList';
import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { ArrowUpRightIcon } from '@/components/icons';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { jobApplyHref } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
import { useGetFocusTags } from '@/components/page/jobs/TeamGroupCard/hooks/useGetFocusTags';
import type { JobSurface } from '@/analytics/jobs.analytics';

// The team card's avatar, so the mark beside the team's name here is the mark
// beside it on the board rather than a second drawing of the same thing.
import tc from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
// The row's own `New` badge and its clock line, for the same reason.
import rr from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
import d from './JobDetailPane.module.scss';

/** A team object for the closed drawer, so `useGetFocusTags` is called
 *  unconditionally. Never rendered — the body is gated on `role && team`. */
const NO_TEAM: IJobTeam = {
  uid: '',
  name: '',
  logoUrl: null,
  focusAreas: [],
  subFocusAreas: [],
  jobReferEmail: null,
};

interface JobDetailPaneProps {
  role: IJobRole | null;
  team: IJobTeam | null;
  /** Already sent, and when — the masthead's stamp says so instead of the age. */
  applied: boolean;
  appliedAt?: string | null;
  /** Drives the outbound `utm_medium` on the original-posting link. */
  source: JobSurface;
  /**
   * Whether to offer the way out to the hiring team's own posting.
   *
   * False for a visitor with no account and for a Job Aspirant — see
   * `canSeeOriginalPosting`. It changes the empty state's sentence as well as
   * the links, because naming a posting and then not linking to it is worse
   * than not mentioning it.
   */
  showOriginalPosting: boolean;
  /**
   * Rendered between the masthead and the description.
   *
   * A slot rather than a flag, because what belongs here depends on who is
   * looking and this pane has never known that — `showOriginalPosting` above is
   * a resolved answer handed down for the same reason. The drawer owns every
   * auth-dependent affordance in this flow; keeping the decision there and the
   * position here is what stops a second copy of `isLoggedIn` appearing in a
   * component whose job is layout.
   */
  banner?: ReactNode;
}

/**
 * The job, read in the app — step 1 of the apply flow.
 *
 * **This was a drawer of its own.** It had its own header, its own sticky footer
 * with an Apply button, and its own idea of how you left it; so did the profile
 * drawer, and so did the apply modal. Pressing Apply opened an unknown number of
 * dialogs in an unknown order and no screen ever said how many were left. All
 * three are panes inside `JobApplyFlowDrawer` now, which owns the chrome and the
 * one footer — so this file is the content and nothing else. What it lost is
 * `open`, `onClose`, `onApply` and `loggedIn`: three of those were chrome, and
 * the fourth only ever fed the footer's sentence, which is the flow's to write
 * because the flow is what knows which step comes next.
 *
 * **The description.** `descriptionHtml` is the posting's own body, scraped by
 * the ingest and sanitized again here — the app ships no CSP, so
 * `sanitizeJobDescriptionHtml` is the only defense layer on this markup, and it
 * is the least trusted markup on the board.
 *
 * It is also repaired before it is sanitized. One ingest ships bodies whose
 * markdown-to-HTML converter half ran: `[label](url)` left as literal text,
 * `&amp;amp;` where a `&` was escaped twice, and one `<ul>` per `<li>` — 52
 * lists for 43 bullets on the worst of them, which a screen reader reads as 52
 * lists. `normalizeJobDescriptionHtml` undoes those three and nothing else; it
 * is a no-op on the 78 of 83 live bodies that arrive well-formed.
 *
 * Coverage used to be the open question, and it kept this screen dark behind a
 * flag: the ingest only carried a body for the teams whose careers sites it
 * could read, 11 of 91 roles on dev. It is 83 of 92 now, which is what retired
 * the flag. The remainder still get the empty state below, which says where the
 * posting actually is and links to it.
 *
 * The body is rendered as it arrives, including whatever the source repeats or
 * links to. Some postings open by restating their own title and end with their
 * own apply link; normalising that away would mean guessing at the structure of
 * markup we do not control, and quietly deleting words the team wrote.
 */
export function JobDetailPane(props: JobDetailPaneProps) {
  const { role, team, applied, appliedAt, source, showOriginalPosting, banner } = props;

  const focusTags = useGetFocusTags(team ?? NO_TEAM);

  const date = role ? getJobDate(role) : null;
  /* One gate for every way out. `null` rather than a separate flag beside each
     link: a href that does not exist cannot be rendered by a branch someone adds
     later without noticing this rule. */
  const postingHref = showOriginalPosting ? jobApplyHref(role?.applyUrl, source) : null;

  const meta = role
    ? [
        role.seniority ? seniorityDisplayLabel(role.seniority) : null,
        role.roleCategory,
        role.location.length ? role.location.join(', ') : null,
        role.workMode ? workplaceTypeDisplayLabel(role.workMode) : null,
      ].filter(Boolean)
    : [];

  /* Sanitizing a multi-kilobyte body on every render is waste — this drawer
     re-renders with the board's state. Keyed on the raw string, so reopening on
     a different role recomputes and reopening on the same one does not. */
  const body = useMemo(() => {
    const raw = role?.descriptionHtml;
    if (!raw) return '';
    const clean = sanitizeJobDescriptionHtml(normalizeJobDescriptionHtml(raw));
    /* Tested on the SANITIZED string, never the raw one. A body that is only a
       hrefless anchor or an image is a perfectly truthy string that sanitizes
       down to nothing, and rendering it would give us an empty section under a
       heading rather than the empty state that says where the posting is. */
    return isBlankHtml(clean) ? '' : clean;
  }, [role?.descriptionHtml]);

  return (
    <>
      {role && team && (
        <>
          {/* The masthead. Everything the row showed, plus the two things it
                had no room for — work mode, and the way out to the team's own
                posting. Left-aligned with the section below it: this is the
                card's content column, not its chrome. */}
          <DetailsSection classes={{ root: d.masthead }}>
            <div className={d.teamRow}>
              <div className={clsx(tc.avatar, d.teamAvatar)}>
                {team.logoUrl ? (
                  <Image src={team.logoUrl} alt={team.name} width={40} height={40} className={tc.avatarImage} />
                ) : (
                  <span className={clsx(tc.avatarInitials, d.teamInitials)}>{teamInitials(team.name)}</span>
                )}
              </div>
              <div className={d.teamMain}>
                {/* Opened from that team's own profile, this link goes where the
                    reader already is — a same-route navigation the drawer
                    survives, so it looks inert. Its side effect is not inert:
                    `backTo` would repoint the profile's Back button at the job
                    board, a page they never came from. Plain text there. */}
                {source === 'team-profile' ? (
                  <span className={d.teamName}>{team.name}</span>
                ) : (
                  <Link
                    prefetch={false}
                    href={`${PAGE_ROUTES.TEAMS}/${team.uid}?backTo=${encodeURIComponent(PAGE_ROUTES.JOBS)}`}
                    className={d.teamName}
                  >
                    {team.name}
                  </Link>
                )}
                {focusTags.length > 0 && (
                  <TagsList tags={focusTags} tagsToShow={100} classes={{ root: tc.focusRow, tag: tc.focusTag }} />
                )}
              </div>
            </div>

            <h1 className={d.title}>{role.roleTitle}</h1>

            {meta.length > 0 && <p className={d.meta}>{meta.join(' · ')}</p>}

            <div className={d.stampRow}>
              {date && isNew(date) && !applied && <span className={rr.newBadge}>● New</span>}
              {date && (
                <span className={clsx(rr.relative, d.stampTone)}>
                  <ClockIcon />
                  {applied && appliedAt ? `Applied ${formatRelativeDays(appliedAt)}` : formatRelativeDays(date)}
                </span>
              )}
              {/* Only alongside a description. With nothing to read in the
                    panel the link is the whole point, and it gets the empty
                    state below instead of a stamp in a metadata row. */}
              {postingHref && body && (
                <a className={d.postingLink} href={postingHref} target="_blank" rel="noopener noreferrer">
                  <ArrowUpRightIcon aria-hidden="true" />
                  Original posting
                </a>
              )}
            </div>
          </DetailsSection>

          {/* Between the masthead and the description, which is where the
              design puts it and also the only place it can go: these sections
              are siblings in a fragment, so the drawer's content column owns
              the 16px between them and nothing here can wrap a subset of them
              without taking that spacing away from the rest. */}
          {banner}

          <DetailsSection>
            <DetailsSectionHeader title="About the role" />
            {body ? (
              /* Sanitized above, and the sanitizer is the allowlist — see
                   `sanitizeJobDescriptionHtml`. No parser here because nothing
                   transforms the nodes; the stylesheet does all the work. */
              <div className={d.body} dangerouslySetInnerHTML={{ __html: body }} />
            ) : (
              /* The honest empty state — still what most roles show, because
                   the ingest only carries a body for the teams whose careers
                   sites it can read. It does not apologise and it does not
                   pretend a description is loading: it says where the posting
                   actually is and sends them there, leaving Apply in the footer
                   untouched — the two are different acts, which is why the board
                   has always had both. */
              <div className={d.emptyBody}>
                {/* Three sentences for three situations, and the third is new.
                    There is a difference between "no posting exists" and "you
                    are not being sent to it", and only the first two can honestly
                    mention where the ad lives. Telling someone the full posting
                    is on the team's own site and then not linking to it is worse
                    than not raising it — so for a viewer without the link the
                    sentence stops at what this screen can actually offer, which
                    is the application. */}
                <p className={d.emptyLead}>
                  {postingHref
                    ? `${team.name} hasn't shared a description here yet. The full posting is on their own site.`
                    : showOriginalPosting
                      ? `${team.name} hasn't shared a description for this role, and there's no posting to link to. Applying still sends them your profile.`
                      : `${team.name} hasn't shared a description for this role. Applying still sends them your profile.`}
                </p>
                {postingHref && (
                  <a className={d.postingLink} href={postingHref} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRightIcon aria-hidden="true" />
                    Read the original posting
                  </a>
                )}
              </div>
            )}
          </DetailsSection>
        </>
      )}
    </>
  );
}
