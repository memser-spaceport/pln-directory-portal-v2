'use client';

import clsx from 'clsx';

import { EnvelopeGlyph } from './EnvelopeGlyph';
import s from './IntroIconAction.module.scss';

interface Props {
  /** Who the intro is to — the accessible name and the tooltip. */
  name: string;
  requested: boolean;
  onRequest: () => void;
  /**
   * Grey at rest, brand on hover, a 14px glyph: the mark beside a name in a
   * list of people. In brand it out-ranked the name it qualifies; grey is the
   * row's other marks (the arrow, the lead badge), and the hover says it is a
   * press. The default (brand, 16px) is for an action cluster, beside Ask AI.
   */
  muted?: boolean;
  className?: string;
}

/**
 * The intro mark on a row or card, icon only: the row's label is the person,
 * and the envelope is the one glyph the intro door wears everywhere. Once
 * sent, the same slot shows the check and takes no press. Search rows, answer
 * cards and a team's member rows all render this one.
 */
export function IntroIconAction({ name, requested, onRequest, muted = false, className }: Props) {
  if (requested) {
    return (
      <span className={clsx(s.done, className)} title="Intro requested" aria-label={`Intro to ${name} requested`}>
        <CheckGlyph />
      </span>
    );
  }
  return (
    <button
      type="button"
      className={clsx(s.btn, muted && s.muted, className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onRequest();
      }}
      aria-label={`Request an intro to ${name}`}
      title="Request an intro"
    >
      <EnvelopeGlyph size={muted ? 14 : 16} />
    </button>
  );
}

// FollowPill's check — the same mark the profile's "Intro requested" wears.
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
