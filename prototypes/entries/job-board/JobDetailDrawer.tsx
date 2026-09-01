'use client';

import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

import { PAGE_ROUTES } from '@/utils/constants';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';
import { formatRelativeDays, getJobDate, isNew, teamInitials } from '@/utils/jobs.utils';

import { Drawer } from '@/components/common/Drawer/Drawer';
import { Button } from '@/components/common/Button';
import { TagsList } from '@/components/common/profile/TagsList';
import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { CheckIcon } from '@/components/icons';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { jobApplyQueryParams } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
import { useGetFocusTags } from '@/components/page/jobs/TeamGroupCard/hooks/useGetFocusTags';

// The same drawer chrome the profile step wears: the sticky 64px header with its
// Back control, and the 720px centred column. Two drawers in one flow that open
// differently would read as two different products.
import s from '@/components/page/demo-day/AppliedInvestorSteps/EditInvestorProfileDrawer/EditInvestorProfileDrawer.module.scss';
// The team card's avatar, so the mark beside the team's name here is the mark
// beside it on the board rather than a second drawing of the same thing.
import tc from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
// The row's own `New` badge and its clock line, for the same reason.
import rr from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
// Button's stylesheet, for the "Applied" state — an <a>/<button> wearing the DS
// button rather than a lookalike, exactly as the row does it.
import btn from '@/components/common/Button/Button.module.scss';

// The profile drawer's sticky footer, imported rather than re-declared: the two
// drawers in this flow end in the same bar, and a second copy of those three
// rules is how they would drift apart.
import pd from './JobProfileDrawer.module.scss';
import { BackIcon } from './JobProfileDrawer';
import { getJobDetail, jobMetaParts } from './jobDetails';
import d from './JobDetailDrawer.module.scss';

/** A team object for the closed drawer, so `useGetFocusTags` is called
 *  unconditionally. Never rendered — the drawer's body is gated on `role`. */
const NO_TEAM: IJobTeam = { uid: '', name: '', logoUrl: null, focusAreas: [], subFocusAreas: [] };

interface JobDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  role: IJobRole | null;
  team: IJobTeam | null;
  /** Hands back to the board's `onApply`, which owns all three outcomes
   *  (sign-up, profile step, cover letter). This screen decides nothing about
   *  who may apply — it only offers. */
  onApply: (role: IJobRole) => void;
  /** Already sent from this session, and when. */
  applied?: boolean;
  appliedAt?: string;
  /** Signed up and waiting on the PL team: the footer says so rather than
   *  promising a press it can't honour. */
  pendingApproval?: boolean;
  loggedIn?: boolean;
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
 * footer, not a capped box with a scroll region inside it. The prototype's
 * modals are all *acts* — send an application, send a referral, create an
 * account — and its drawer is the place you work in. Reading a job is the
 * second thing.
 *
 * **What Apply does here.** Nothing new. It calls the board's `onApply`, the one
 * entry point that already branches on logged-out / incomplete profile /
 * pending / ready. This drawer closes on the way through, because the next step
 * in two of those branches is itself a drawer.
 *
 * **The description is mocked.** See `jobDetails.ts` — production's job records
 * carry no body at all, which is the reason the board has always sent people to
 * an external posting. That link survives, at the top of this panel and on the
 * row: reading our summary and reading the team's own ad are different things.
 */
export function JobDetailDrawer(props: JobDetailDrawerProps) {
  const {
    open,
    onClose,
    role,
    team,
    onApply,
    applied = false,
    appliedAt,
    pendingApproval = false,
    loggedIn = false,
  } = props;

  const focusTags = useGetFocusTags(team ?? NO_TEAM);

  const detail = role && team ? getJobDetail(role, team) : null;
  const date = role ? getJobDate(role) : null;
  const meta = role ? jobMetaParts(role) : [];

  const postingHref = role?.applyUrl ? `${role.applyUrl}?${jobApplyQueryParams('job-board')}` : null;

  /* One sentence under the button, and it changes with what the press will
     actually do. A footer that promised "one click" to someone with no account
     would be describing a different person's experience of the same button. */
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
        {role && team && detail && (
          <>
            {/* The masthead. Everything the row showed, plus the two things it
                had no room for — work mode, and the way out to the team's own
                posting. Left-aligned with every section below it: this is the
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
                {postingHref && (
                  <a className={d.postingLink} href={postingHref} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRightIcon aria-hidden="true" />
                    Original posting
                  </a>
                )}
              </div>
            </DetailsSection>

            <DetailsSection>
              <DetailsSectionHeader title="About the role" />
              {detail.summary.map((para) => (
                <p key={para} className={d.para}>
                  {para}
                </p>
              ))}
            </DetailsSection>

            <DetailsSection>
              <DetailsSectionHeader title="What you will do" />
              <ul className={d.list}>
                {detail.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </DetailsSection>

            <DetailsSection>
              <DetailsSectionHeader title="What they are looking for" />
              <ul className={d.list}>
                {detail.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {detail.niceToHave.length > 0 && (
                <>
                  <p className={d.subLabel}>Nice to have</p>
                  <ul className={d.list}>
                    {detail.niceToHave.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
            </DetailsSection>

            {/* The two questions everyone scrolls a posting for and most
                postings bury. One section, because they are the same question
                asked twice: what happens if I go for this. */}
            <DetailsSection>
              <DetailsSectionHeader title="Pay and process" />
              <dl className={d.facts}>
                <dt>Compensation</dt>
                <dd>{detail.compensation}</dd>
                <dt>Hiring process</dt>
                <dd>{detail.process}</dd>
              </dl>
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
               offer, and it keeps the disabled paint for the reason written in
               `JobReferRoleRow.module.scss`: at full contrast it still looks
               pressable. */
            <button
              type="button"
              disabled
              className={clsx(btn.root, btn.medium, btn.border, btn.neutral, d.appliedButton, pd.footerAction)}
            >
              <CheckIcon width={14} height={14} aria-hidden="true" />
              Applied
            </button>
          ) : (
            <Button
              variant="primary"
              style="fill"
              size="m"
              className={pd.footerAction}
              onClick={() => {
                if (!role) return;
                /* Closed on the way through: two of `onApply`'s three outcomes
                   are themselves a drawer, and stacking one over another would
                   double the backdrop and leave two Back controls on screen. */
                onClose();
                onApply(role);
              }}
            >
              Apply
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
