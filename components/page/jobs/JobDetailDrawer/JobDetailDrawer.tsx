'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

import { PAGE_ROUTES } from '@/utils/constants';
import { isBlankHtml, sanitizeJobDescriptionHtml } from '@/utils/html';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';
import {
  formatRelativeDays,
  getJobDate,
  isNew,
  seniorityDisplayLabel,
  teamInitials,
  workplaceTypeDisplayLabel,
} from '@/utils/jobs.utils';

import { Drawer } from '@/components/common/Drawer';
import { Button } from '@/components/common/Button';
import { TagsList } from '@/components/common/profile/TagsList';
import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { CheckIcon, ArrowUpRightIcon } from '@/components/icons';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import {
  interceptPrimaryApplyClick,
  jobApplyHref,
} from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
import { useGetFocusTags } from '@/components/page/jobs/TeamGroupCard/hooks/useGetFocusTags';
import type { JobSurface } from '@/analytics/jobs.analytics';

// The same drawer chrome the profile step wears: the sticky 64px header with its
// Back control, and the 720px centred column. Two drawers in one flow that
// opened differently would read as two different products.
import s from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer.module.scss';
// The team card's avatar, so the mark beside the team's name here is the mark
// beside it on the board rather than a second drawing of the same thing.
import tc from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
// The row's own `New` badge and its clock line, for the same reason.
import rr from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
// Button's stylesheet, for the "Applied" state — a <button> wearing the DS
// button rather than a lookalike, exactly as the row does it.
import btn from '@/components/common/Button/Button.module.scss';
// The profile drawer's sticky footer, imported rather than re-declared: the two
// drawers in this flow end in the same bar, and a second copy of those rules is
// how they would drift apart.
import pd from '@/components/page/jobs/JobProfileDrawer/JobProfileDrawer.module.scss';
import { BackIcon } from '@/components/page/jobs/JobProfileDrawer/JobProfileDrawer';

import d from './JobDetailDrawer.module.scss';

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

interface JobDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  role: IJobRole | null;
  team: IJobTeam | null;
  /** Hands back to the board's `onApply`, which owns every outcome (sign-up,
   *  profile step, pending, cover letter). This screen decides nothing about who
   *  may apply — it only offers. */
  onApply: () => void;
  /** Already sent, and when. */
  applied: boolean;
  appliedAt?: string | null;
  /**
   * Unapproved: Apply is the outbound posting, not the in-app letter. The
   * locked-apply copy would be a lie once the control actually sends them
   * there.
   */
  externalApply?: boolean;
  loggedIn: boolean;
  /** Drives the outbound `utm_medium` on the original-posting link. */
  source: JobSurface;
}

/**
 * The job, read in the app.
 *
 * **Why a drawer and not a modal.** Reading a posting is not an act you complete
 * and dismiss — it is the middle of a scan. On a board the rhythm is look, open,
 * decide, close, open the next one, and a right-hand panel keeps the list you
 * came from in place while a centred modal blanks it. It is also the shape the
 * content wants: a description is a long scroll with one action that must stay
 * reachable at the bottom of it, which is a full-height panel with a sticky
 * footer, not a capped box with a scroll region inside it. Every other overlay
 * in this flow is an *act* — send an application, send a referral, create an
 * account — and this is the place you work in.
 *
 * **What Apply does here.** For approved members it calls the board's `onApply`,
 * the one entry point that already branches on logged-out / incomplete /
 * ready. For unapproved members the footer is the outbound posting link.
 *
 * **The description arrives, but not for most jobs.** `descriptionHtml` is the
 * posting's own body, scraped by the ingest and sanitized again here — the app
 * ships no CSP, so `sanitizeJobDescriptionHtml` is the only defense layer on
 * this markup, and it is the least trusted markup on the board. Roles without
 * one (the majority: the ingest only carries a body for the teams whose careers
 * sites it can read) still get the empty state below, which is why
 * `SHOW_JOB_DETAIL` remains dark. Coverage flips that flag, not this component.
 *
 * The body is rendered as it arrives, including whatever the source repeats or
 * links to. Some postings open by restating their own title and end with their
 * own apply link; normalising that away would mean guessing at the structure of
 * markup we do not control, and quietly deleting words the team wrote.
 */
export function JobDetailDrawer(props: JobDetailDrawerProps) {
  const { open, onClose, role, team, onApply, applied, appliedAt, externalApply = false, loggedIn, source } = props;

  const focusTags = useGetFocusTags(team ?? NO_TEAM);

  const date = role ? getJobDate(role) : null;
  const postingHref = jobApplyHref(role?.applyUrl, source);

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
    const clean = sanitizeJobDescriptionHtml(raw);
    /* Tested on the SANITIZED string, never the raw one. A body that is only a
       hrefless anchor or an image is a perfectly truthy string that sanitizes
       down to nothing, and rendering it would give us an empty section under a
       heading rather than the empty state that says where the posting is. */
    return isBlankHtml(clean) ? '' : clean;
  }, [role?.descriptionHtml]);

  /* One sentence under the button, and it changes with what the press will
     actually do. A footer promising "one press" to someone with no account would
     be describing a different person's experience of the same button. */
  const hint = applied
    ? appliedAt
      ? `Applied ${formatRelativeDays(appliedAt)}. Your profile went with your note.`
      : 'Your profile went with your note.'
    : externalApply
      ? postingHref
        ? "You'll apply on their site — the original posting opens in a new tab."
        : null
      : loggedIn
        ? 'One press sends your PL profile with a short note. Nothing to refill.'
        : 'Applying sends your PL profile — you will set one up in the next step.';

  return (
    <Drawer isOpen={open} onClose={onClose}>
      <div className={s.drawerHeader}>
        <div className={s.breadcrumbs}>
          <button type="button" className={s.backButton} onClick={onClose}>
            <BackIcon />
            <span>Back to roles</span>
          </button>
        </div>
      </div>

      <div className={s.drawerContent}>
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
                  <Link
                    prefetch={false}
                    href={`${PAGE_ROUTES.TEAMS}/${team.uid}?backTo=${encodeURIComponent(PAGE_ROUTES.JOBS)}`}
                    className={d.teamName}
                  >
                    {team.name}
                  </Link>
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
                  <p className={d.emptyLead}>
                    {postingHref
                      ? `${team.name} hasn't shared a description here yet. The full posting is on their own site.`
                      : externalApply
                        ? `${team.name} hasn't shared a description for this role, and there's no posting to link to.`
                        : `${team.name} hasn't shared a description for this role, and there's no posting to link to. Applying still sends them your profile.`}
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
      </div>

      {/* The same bar the profile drawer ends in. Sticky, because a description
          is long enough that an action at the end of it is an action most people
          never reach. */}
      {(applied || !externalApply || postingHref) && (
        <div className={pd.footer}>
          <div className={pd.footerInner}>
            {hint && <p className={pd.footerHint}>{hint}</p>}
            {applied ? (
              /* The row's applied control, in the row's shell — a report, not an
                 offer, and `disabled` is the honest semantics: there is nothing
                 left to press. */
              <button
                type="button"
                disabled
                className={clsx(btn.root, btn.medium, btn.border, btn.neutral, d.appliedButton)}
              >
                <CheckIcon width={14} height={14} aria-hidden="true" />
                Applied
              </button>
            ) : externalApply && postingHref ? (
              <a
                className={clsx(btn.root, btn.medium, btn.fill, btn.primary, d.applyLink)}
                href={postingHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => interceptPrimaryApplyClick(event, onApply)}
              >
                Apply
              </a>
            ) : (
              <Button variant="primary" style="fill" size="m" onClick={onApply}>
                Apply
              </Button>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
