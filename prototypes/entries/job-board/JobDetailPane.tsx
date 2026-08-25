'use client';

import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

import { PAGE_ROUTES } from '@/utils/constants';
import type { IJobRole, IJobTeam } from '@/types/jobs.types';
import { formatRelativeDays, getJobDate, isNew, teamInitials } from '@/utils/jobs.utils';

import { TagsList } from '@/components/common/profile/TagsList';
import { DetailsSection } from '@/components/common/profile/DetailsSection/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { ArrowUpRightIcon } from '@/components/icons/ArrowUpRightIcon';
import { ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { jobApplyQueryParams } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';
import { useGetFocusTags } from '@/components/page/jobs/TeamGroupCard/hooks/useGetFocusTags';

// The team card's avatar, so the mark beside the team's name here is the mark
// beside it on the board rather than a second drawing of the same thing.
import tc from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
// The row's own `New` badge and its clock line, for the same reason.
import rr from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';

import { getJobDetail, jobMetaParts } from './jobDetails';
import d from './JobDetailPane.module.scss';

/** A team object for the closed pane, so `useGetFocusTags` is called
 *  unconditionally. Never rendered — the body is gated on `role`. */
const NO_TEAM: IJobTeam = { uid: '', name: '', logoUrl: null, focusAreas: [], subFocusAreas: [] };

interface JobDetailPaneProps {
  role: IJobRole | null;
  team: IJobTeam | null;
  /** Already sent from this session — the stamp row reports when instead of how old. */
  applied?: boolean;
  appliedAt?: string;
}

/**
 * Step 1 of the apply flow: the job, read in the app.
 *
 * **This used to be a drawer of its own** (`JobDetailDrawer`), with its own
 * header, its own sticky footer and its own Apply button that closed it and
 * handed the press back to the board. It is now a pane inside
 * `JobApplyFlowDrawer`, which owns all three of those — one drawer, one header,
 * one footer, one rail saying where you are. What is left here is the only part
 * that was ever about *this* step: the description.
 *
 * **Why the flow opens on reading.** A posting is not something you complete and
 * dismiss, it is the middle of a scan — look, open, decide, close, open the next
 * one. So the flow's first step is the one you are allowed to leave from, and its
 * footer says `Apply` rather than `Next`: someone who only came to read sees
 * exactly what they saw before, plus a rail that tells them what pressing Apply
 * is going to cost. Naming the whole sequence up front is the point — Apply used
 * to open an unknown number of dialogs.
 *
 * **The description is mocked.** See `jobDetails.ts` — production's job records
 * carry no body at all, which is the reason the board has always sent people to
 * an external posting. That link survives, in this pane's masthead and on the
 * row: reading our summary and reading the team's own ad are different things.
 */
export function JobDetailPane(props: JobDetailPaneProps) {
  const { role, team, applied = false, appliedAt } = props;

  const focusTags = useGetFocusTags(team ?? NO_TEAM);

  const detail = role && team ? getJobDetail(role, team) : null;
  const date = role ? getJobDate(role) : null;
  const meta = role ? jobMetaParts(role) : [];

  const postingHref = role?.applyUrl ? `${role.applyUrl}?${jobApplyQueryParams('job-board')}` : null;

  if (!role || !team || !detail) return null;

  return (
    <>
      {/* The masthead. Everything the row showed, plus the two things it had no
          room for — work mode, and the way out to the team's own posting.
          Left-aligned with every section below it: this is the pane's content
          column, not its chrome. */}
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

      {/* The two questions everyone scrolls a posting for and most postings bury.
          One section, because they are the same question asked twice: what
          happens if I go for this. */}
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
  );
}
