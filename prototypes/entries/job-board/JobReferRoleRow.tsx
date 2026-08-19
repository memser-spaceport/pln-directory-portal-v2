'use client';

import { HTMLProps, useState } from 'react';
import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';

import type { IJobRole } from '@/types/jobs.types';
import type { JobSurface } from '@/analytics/jobs.analytics';
import { formatRelativeDays, getJobDate, isNew, seniorityDisplayLabel } from '@/utils/jobs.utils';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ReferMenu } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/ReferMenu';
import { ArrowIcon, ClockIcon } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/components/Icons';
import { JOB_QUERY_PARAMS } from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/constants';

// Reuse the production ReferRoleRow styling 1:1, with local extras for the button.
import s from '@/components/page/jobs/TeamGroupCard/component/ReferRoleRow/ReferRoleRow.module.scss';
// Button's own stylesheet, so the Apply anchor is the real DS button and not a
// hand-rolled lookalike.
import btn from '@/components/common/Button/Button.module.scss';
import js from './JobReferRoleRow.module.scss';

import { BoltIcon } from './icons';
import { ReferModal } from './components/ReferModal';

interface JobReferRoleRowProps {
  role: IJobRole;
  teamId: string;
  teamName: string;
  /** Mirrors production's `source`: this row is shared by the board and team-profile prototypes. */
  source?: JobSurface;
  onClick?: () => void;
  /** True only while the "Best match for me" sort is on — see `showMatch` below. */
  showMatch?: boolean;
  /** Referring needs a signed-in referrer; logged out, the button nudges instead. */
  canRefer?: boolean;
  onReferBlocked?: () => void;
  /**
   * Rank the row's actions instead of leaving them level: Apply becomes a
   * labelled primary button and Refer drops to a tertiary text button.
   *
   * Off by default so the board is untouched. On the board you are scanning
   * dozens of roles across teams and the arrow is a repeated affordance, not a
   * call to action. On a single team's profile you have already chosen the
   * team, so applying is the point of the row and should look like it — and
   * referring someone else is the sideline, not the peer.
   */
  primaryApply?: boolean;
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
  const {
    role,
    teamId,
    teamName,
    source = 'job-board',
    onClick,
    showMatch = false,
    canRefer = true,
    onReferBlocked,
    primaryApply = false,
  } = props;
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
                role, it isn't something you can do to it.

                "Matches you", not a bare "Match", because this page holds two
                things a role could be matching: the filters applied in the rail
                right now, and the preferences saved in the modal. That difference
                — transient narrowing versus stated intent — is the whole feature,
                and "Match" sits ambiguously between them. "you" names which one.

                Not "Top match". `matchesPreferences` is a boolean — a role either
                satisfies the stated criteria or it doesn't, and there's no score
                behind it. "Top" would promise a ranking the data can't back, on
                every matching role at once. */}
            {showMatch && (
              <Badge variant="brand" className={js.matchBadge}>
                <BoltIcon />
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
            {/* Tertiary under `primaryApply`: `.link` carries no `neutral`, so
                `secondary` is the design system's quiet text button. It also
                zeroes padding and min-width, which is why `.referButton` — pure
                horizontal padding for the bordered shape — is dropped with it. */}
            <Button
              size="s"
              style={primaryApply ? 'link' : 'border'}
              variant={primaryApply ? 'secondary' : 'neutral'}
              className={primaryApply ? undefined : js.referButton}
              onClick={() => (canRefer ? setReferOpen(true) : onReferBlocked?.())}
            >
              Refer
            </Button>

            <ReferMenu role={role} teamId={teamId} teamName={teamName} source={source} />

            {/* An anchor wearing Button's classes rather than a <Button>: this
                opens an external posting, so it has to stay a real link (new
                tab, middle-click, copy address). `Button` renders a <button>
                and nesting one inside an <a> is invalid. */}
            {primaryApply ? (
              <a
                className={clsx(btn.root, btn.small, btn.fill, btn.primary, js.applyButton)}
                aria-label={`Apply to ${roleTitle}`}
                {...linkProps}
              >
                Apply
              </a>
            ) : (
              <a className={s.applyArrow} aria-label={`Apply to ${roleTitle}`} {...linkProps}>
                <ArrowIcon />
              </a>
            )}
          </div>
        </div>
      </div>

      <ReferModal
        open={referOpen}
        onClose={() => setReferOpen(false)}
        role={role}
        teamId={teamId}
        teamName={teamName}
        source={source}
      />
    </>
  );
}
