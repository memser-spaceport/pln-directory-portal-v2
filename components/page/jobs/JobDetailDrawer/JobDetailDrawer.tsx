'use client';

import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

import { PAGE_ROUTES } from '@/utils/constants';
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
import { jobApplyQueryParams } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
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
const NO_TEAM: IJobTeam = { uid: '', name: '', logoUrl: null, focusAreas: [], subFocusAreas: [] };

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
  /** Signed up and waiting on the PL team: the footer says so rather than
   *  promising a press it cannot honour. */
  pendingApproval: boolean;
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
 * **What Apply does here.** Nothing new. It calls the board's `onApply`, the one
 * entry point that already branches on logged-out / incomplete profile /
 * pending / ready.
 *
 * **The description is the open question, not the layout.** `IJobRole` carries
 * no body: the board's rows are scraped listing headers and the description has
 * always lived behind the outbound link. `summary` is modelled and rendered
 * here, but nothing sends it yet — the backend column exists and the board's
 * query service does not select it. Until that changes this panel shows its
 * empty state, which is exactly why `SHOW_JOB_DETAIL` is dark. See the flag.
 */
export function JobDetailDrawer(props: JobDetailDrawerProps) {
  const { open, onClose, role, team, onApply, applied, appliedAt, pendingApproval, loggedIn, source } = props;

  const focusTags = useGetFocusTags(team ?? NO_TEAM);

  const date = role ? getJobDate(role) : null;
  const postingHref = role?.applyUrl ? `${role.applyUrl}?${jobApplyQueryParams(source)}` : null;

  const meta = role
    ? [
        role.seniority ? seniorityDisplayLabel(role.seniority) : null,
        role.roleCategory,
        role.location.length ? role.location.join(', ') : null,
        role.workMode ? workplaceTypeDisplayLabel(role.workMode) : null,
      ].filter(Boolean)
    : [];

  const summary = role?.summary?.trim() || '';

  /* One sentence under the button, and it changes with what the press will
     actually do. A footer promising "one press" to someone with no account would
     be describing a different person's experience of the same button. */
  const hint = applied
    ? appliedAt
      ? `Applied ${formatRelativeDays(appliedAt)}. Your profile went with your note.`
      : 'Your profile went with your note.'
    : pendingApproval
      ? 'Your account is waiting on PL team approval. Applying unlocks once it lands.'
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
                {postingHref && summary && (
                  <a className={d.postingLink} href={postingHref} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRightIcon aria-hidden="true" />
                    Original posting
                  </a>
                )}
              </div>
            </DetailsSection>

            <DetailsSection>
              <DetailsSectionHeader title="About the role" />
              {summary ? (
                <p className={d.para}>{summary}</p>
              ) : (
                /* The honest empty state, and for now the only one anyone will
                   see. It does not apologise and it does not pretend a summary
                   is loading: it says where the description actually is and
                   sends them there, leaving Apply in the footer untouched — the
                   two are different acts, which is why the board has always had
                   both. */
                <div className={d.emptyBody}>
                  <p className={d.emptyLead}>
                    {postingHref
                      ? `${team.name} hasn't shared a description here yet. The full posting is on their own site.`
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
      <div className={pd.footer}>
        <div className={pd.footerInner}>
          <p className={pd.footerHint}>{hint}</p>
          {applied ? (
            /* The row's applied control, in the row's shell — a report, not an
               offer, and `disabled` is the honest semantics: there is nothing
               left to press. */
            <button type="button" disabled className={clsx(btn.root, btn.medium, btn.border, btn.neutral)}>
              <CheckIcon width={14} height={14} aria-hidden="true" />
              Applied
            </button>
          ) : (
            <Button variant="primary" style="fill" size="m" onClick={onApply}>
              Apply
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
