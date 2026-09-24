'use client';

import clsx from 'clsx';

import { Button, type ButtonProps } from '@/components/common/Button';

import { EnvelopeGlyph } from './EnvelopeGlyph';
import s from './RequestIntroButton.module.scss';

interface Props {
  requested: boolean;
  onClick: () => void;
  /** Who the intro is to — the accessible label. */
  name: string;
  /** DS size; `xs` is the header's. A phone's full-width row takes `s`. */
  size?: ButtonProps['size'];
  className?: string;
}

/**
 * The profile-header press. Bordered **brand** (the DS `border` + `primary`
 * pair) at the header's small size: the page has one filled button, Schedule
 * Meeting, and that is the stronger route to the person (office hours, "no
 * introduction needed"); the intro through the PL team is the second route —
 * Demo Day's Invest / Make an Intro pair. It went grey for a day ("Let's do
 * request intro grey") and came back blue once Follow, which is grey, joined
 * the same corner: two grey pills there read as one kind of thing, and the
 * reach press is not the relationship toggle. Once sent it reads
 * "Intro requested" as a line of text, not a pill: a sent
 * request is a receipt, and once Follow stands in the same cluster a second
 * grey check-pill beside "Following ✓" would read as one kind of thing twice
 * (2026-09-24, the member-follow entry). It keeps the pill's height and ink
 * so the row does not move when it lands. One request per person.
 */
export function RequestIntroButton({ requested, onClick, name, size = 'xs', className }: Props) {
  if (requested) {
    return (
      <span
        className={clsx(s.sent, size === 's' && s.sentS, className)}
        role="status"
        aria-label={`Intro to ${name} requested`}
        title="Your request is with the PL team"
      >
        {/* Two words. "· with the PL team" was drawn after them and cost the
            header's facts column 100px — the role wrapped under the team. The
            toast and the title carry where the request went. */}
        <CheckGlyph />
        <span>Intro requested</span>
      </span>
    );
  }
  return (
    /* Bordered brand — back from grey (2026-09-24, "let's make request an
       intro blue outlined"): with Follow now the grey pill in the corner, the
       reach press wants the brand line so the two do not read as one kind. */
    <Button
      size={size}
      style="border"
      variant="primary"
      className={clsx(s.btn, className)}
      aria-label={`Request an intro to ${name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      {/* 16px ("Make letter icon for request an intro 16 px"). */}
      <EnvelopeGlyph size={16} />
      <span>Request an intro</span>
    </Button>
  );
}

// FollowPill's check, so the two resting states in one header match.
const CheckGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M13.25 4.75 6.5 11.5 2.75 7.75"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
