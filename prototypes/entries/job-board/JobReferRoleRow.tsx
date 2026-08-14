'use client';

import { HTMLProps, useState } from 'react';
import isEmpty from 'lodash/isEmpty';

import type { IJobRole } from '@/types/jobs.types';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { Badge } from '@/components/common/Badge';
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
  teamId: string;
  teamName: string;
  onClick?: () => void;
  /** True only while the "Best match for me" sort is on — see `showMatch` below. */
  showMatch?: boolean;
  /** Referring needs a signed-in referrer; logged out, the button nudges instead. */
  canRefer?: boolean;
  onReferBlocked?: () => void;
}

/**
 * COPY of production `ReferRoleRow` with the "Refer" button added back alongside
 * the share icon. The two are different jobs: the share icon pushes the role out
 * to LinkedIn/X, the Refer button opens the in-network referral modal.
 *
 * Two additions for the match nudge:
 *  - a **match badge**, shown only while the match sort is active. Always-on would
 *    put a permanent marker on most rows for people who have preferences, and the
 *    badge would stop meaning anything. It carries no "why" text because the meta
 *    line directly under the title already names the category, level and location
 *    it matched on.
 *  - **Refer is gated when logged out.** Not a paywall — you genuinely cannot
 *    vouch for someone as nobody, and the modal signs the note with your name.
 *    Apply is never gated: blocking an application to harvest a login would be
 *    taking something from the person to get something from them.
 */
export function JobReferRoleRow(props: JobReferRoleRowProps) {
  const { role, teamId, teamName, onClick, showMatch = false, canRefer = true, onReferBlocked } = props;
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
            {/* Beside the title rather than out with the actions: it qualifies the
                role, it isn't something you can do to it. */}
            {showMatch && (
              <Badge variant="brand" className={js.matchBadge}>
                Matches you
              </Badge>
            )}
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
              onClick={() => (canRefer ? setReferOpen(true) : onReferBlocked?.())}
            >
              Refer
            </Button>

            <ReferMenu role={role} teamId={teamId} teamName={teamName} />

            <a className={s.applyArrow} aria-label={`Apply to ${roleTitle}`} {...linkProps}>
              <ArrowIcon />
            </a>
          </div>
        </div>
      </div>

      <ReferModal
        open={referOpen}
        onClose={() => setReferOpen(false)}
        role={role}
        teamId={teamId}
        teamName={teamName}
      />
    </>
  );
}
