'use client';

import clsx from 'clsx';

// Production's glossy primary — the Schedule Meeting this press stands in for.
import office from '@/components/page/member-details/OfficeHoursDetails/components/OfficeHoursView/OfficeHoursView.module.scss';

import { EnvelopeGlyph } from './EnvelopeGlyph';
import s from './RequestIntroButton.module.scss';

interface Props {
  requested: boolean;
  onClick: () => void;
  /** Who the intro is to — the accessible label. */
  name: string;
  /**
   * `xs` is the header cluster's (34px, the DS xs height). A phone's
   * full-width row takes `s` (38px, production's own padding).
   * `compact` is AI search's: the exact box of production's "Available to
   * connect" badge (`OhBadge`), painted as a press — see the stylesheet.
   */
  size?: 'xs' | 's' | 'compact';
  className?: string;
}

/**
 * The profile-header press — the page's ONE contact action when the member
 * has no office hours, and the team profile's contact action. Production's
 * glossy primary, by class (`OfficeHoursView.primaryButton`, the Schedule
 * Meeting it stands in for), with the 16px envelope.
 *
 * It used to be the bordered second route beside a filled Schedule Meeting
 * (Demo Day's Invest / Make an Intro pair). Design standup, 2026-09-28: never
 * both. Booking is the intended way in, and an intro offered beside it
 * competes with it — so a member with office hours shows Schedule Meeting
 * only, and one without shows this, filled, as the primary. With nothing to
 * be second to, a bordered press would be a weaker primary, not a quieter one
 * (design-thinking lesson 18).
 *
 * Once sent it reads "Intro requested" as a line of text, not a pill: a sent
 * request is a receipt. It keeps the press's height and ink so the cluster
 * does not move when it lands. One request per person or team.
 */
export function RequestIntroButton({ requested, onClick, name, size = 'xs', className }: Props) {
  const compact = size === 'compact';
  if (requested) {
    return (
      <span
        className={clsx(s.sent, size === 's' && s.sentS, compact && s.sentCompact, className)}
        role="status"
        aria-label={`Intro to ${name} requested`}
        title="Your request is with the PL team"
      >
        {/* Two words. "· with the PL team" was drawn after them and cost the
            header's facts column 100px — the role wrapped under the team. The
            toast and the title carry where the request went. */}
        <CheckGlyph size={compact ? 12 : 14} />
        <span>Intro requested</span>
      </span>
    );
  }
  if (compact) {
    /* A plain button, not the DS Button: the badge's 16px box is under the
       DS scale's smallest size (xxs, 24px), and overriding every size rule of
       it would be a fork by another name. */
    return (
      <button
        type="button"
        className={clsx(s.compact, className)}
        aria-label={`Request an intro to ${name}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
      >
        {/* 12px: the badge's calendar glyph. */}
        <EnvelopeGlyph size={12} />
        <span>Request an intro</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className={clsx(office.primaryButton, s.primary, size === 's' && s.primaryS, className)}
      aria-label={`Request an intro to ${name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      {/* 16px ("Make letter icon for request an intro 16 px"); white on the
          fill, since the glyph takes `currentColor`. */}
      <EnvelopeGlyph size={16} />
      <span>Request an intro</span>
    </button>
  );
}

// FollowPill's check, so the two resting states in one header match.
const CheckGlyph = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M13.25 4.75 6.5 11.5 2.75 7.75"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
