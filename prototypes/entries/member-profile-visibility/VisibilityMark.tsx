'use client';

import clsx from 'clsx';
import { Popover } from '@base-ui-components/react/popover';

import b from '@/components/common/Badge/Badge.module.scss';

import pill from '../profile-shared/PlTeamOnlyPill.module.scss';

import { AUDIENCES, type AudienceKey } from './audiences';
import s from './VisibilityMark.module.scss';

/**
 * The proposed visibility mark, drawn as the privacy pill production already
 * uses for Job search status (`PlTeamOnlyPill`: grey fill, 11px uppercase, 12px
 * glyph) so every "who can see this" mark on the profile is one object, told
 * apart by icon and word rather than by hue. Pressing it names who can see the
 * section, in one sentence.
 *
 * Grey because the mark is a fact about the section, not an action on it — the
 * current design's blue "Members only" wears the same ink as `+ Add` and `Edit`
 * beside it, and reads as one more control. And one lineage because a colour
 * code with no legend asks the reader to learn three meanings for one question.
 *
 * Only drawn where a section's audience differs from the page's default (see
 * `DEFAULT_AUDIENCE`, said once at the top of the page).
 */
export function VisibilityMark({ audience }: { audience: AudienceKey }) {
  const a = AUDIENCES[audience];
  return (
    <Popover.Root openOnHover delay={150}>
      <Popover.Trigger className={clsx(pill.pill, s.trigger)} aria-label={`${a.label}. ${a.who}`}>
        <AudienceIcon icon={a.icon} />
        {a.label}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} className={s.positioner}>
          <Popover.Popup className={s.popup}>{a.who}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * The current design, transcribed from the screenshots under review: one badge
 * on every section, Public green, Members only blue, Private grey. Static — the
 * current badges explain nothing on press.
 */
export function CurrentVisibilityBadge({ kind }: { kind: 'public' | 'members' | 'private' }) {
  const variant = kind === 'public' ? b.success : kind === 'members' ? b.brand : b.default;
  const icon = kind === 'public' ? 'globe' : kind === 'members' ? 'people' : 'lock';
  const label = kind === 'public' ? 'Public' : kind === 'members' ? 'Members only' : 'Private';
  return (
    <span className={clsx(b.root, variant, s.current)}>
      <AudienceIcon icon={icon} />
      {label}
    </span>
  );
}

export function AudienceIcon({ icon }: { icon: 'globe' | 'people' | 'lock' }) {
  if (icon === 'globe') {
    return (
      <svg className={s.icon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M2 8h12M8 2c1.6 1.7 2.4 3.7 2.4 6S9.6 12.3 8 14M8 2C6.4 3.7 5.6 5.7 5.6 8s.8 4.3 2.4 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (icon === 'people') {
    return (
      <svg className={s.icon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="6" cy="5.5" r="2.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.75 13c.5-2.2 2.1-3.5 4.25-3.5s3.75 1.3 4.25 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10.5 3.4a2.25 2.25 0 0 1 0 4.2M11.8 9.7c1.2.5 2.1 1.6 2.45 3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={s.icon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
