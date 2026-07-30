'use client';

import { HTMLProps, useState } from 'react';
import isEmpty from 'lodash/isEmpty';

import type { IJobRole } from '@/types/jobs.types';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { Button } from '@/components/common/Button';
import { ReferMenu } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu';
import { ArrowIcon, ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { JOB_QUERY_PARAMS } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';

// Reuse the production ReferRoleRow styling 1:1, with local extras for the button.
import s from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
import js from './JobReferRoleRow.module.scss';

import { ReferModal } from './components/ReferModal';

interface JobReferRoleRowProps {
  role: IJobRole;
  teamName: string;
  onClick?: () => void;
}

/**
 * COPY of production `ReferRoleRow` with the "Refer" button added back alongside
 * the share icon. The two are different jobs: the share icon pushes the role out
 * to LinkedIn/X, the Refer button opens the in-network referral modal.
 */
export function JobReferRoleRow(props: JobReferRoleRowProps) {
  const { role, teamName, onClick } = props;
  const [referOpen, setReferOpen] = useState(false);

  const { location, seniority, roleTitle, applyUrl, roleCategory } = role;

  const date = getJobDate(role);
  const relative = formatRelativeDays(date);
  const showNew = isNew(date);
  const locationDisplay = isEmpty(location) ? null : location.join(', ');

  const metaParts = [seniority ? seniorityDisplayLabel(seniority) : null, roleCategory, locationDisplay].filter(
    Boolean,
  );

  const linkProps: HTMLProps<HTMLAnchorElement> = applyUrl
    ? { href: `${applyUrl}?${JOB_QUERY_PARAMS}`, target: '_blank', rel: 'noopener noreferrer', onClick }
    : {};

  return (
    <>
      <div className={`${s.root} ${s.row}`}>
        <div className={s.body}>
          <div className={s.titleRow}>
            <a className={`${s.title} ${s.titleLink}`} {...linkProps}>
              {roleTitle}
            </a>
            {/* Mobile-only: "New" aligned to the top-right, in line with the role name. */}
            {showNew && <span className={`${s.newBadge} ${s.newBadgeMobile}`}>● New</span>}
          </div>
          {!isEmpty(metaParts) && <div className={s.meta}>{metaParts.join(' · ')}</div>}
        </div>

        <div className={`${s.right} ${s.actions}`}>
          {showNew && <span className={`${s.newBadge} ${s.newBadgeDesktop}`}>● New</span>}
          {relative && (
            <span className={s.relative}>
              <ClockIcon />
              {relative}
            </span>
          )}

          <div className={s.actionButtons}>
            <Button
              size="s"
              style="border"
              variant="neutral"
              className={js.referButton}
              onClick={() => setReferOpen(true)}
            >
              Refer
            </Button>

            <ReferMenu role={role} teamName={teamName} />

            <a className={s.applyArrow} aria-label={`Apply to ${roleTitle}`} {...linkProps}>
              <ArrowIcon />
            </a>
          </div>
        </div>
      </div>

      <ReferModal open={referOpen} onClose={() => setReferOpen(false)} role={role} teamName={teamName} />
    </>
  );
}
