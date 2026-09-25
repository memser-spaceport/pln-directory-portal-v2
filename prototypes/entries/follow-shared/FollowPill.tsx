'use client';

import clsx from 'clsx';

import { Button, type ButtonProps } from '@/components/common/Button';

import s from './FollowPill.module.scss';

interface Props {
  following: boolean;
  onToggle: () => void;
  /** What you're following — used in the accessible label. */
  name: string;
  /** DS size; `xs` is the header's. A phone row of shared-width buttons takes `s`. */
  /**
   * DS size; `xs` is the team header's. A phone row of shared-width buttons
   * takes `s`. The member profile's corner takes `xxs` — the secondary pill
   * at the height of the Ask AI text action beside it (2026-09-24: tried as
   * a link, then "Make it secondary but smaller, same size as Ask AI"); the
   * glyph steps down to 12px with it.
   */
  size?: ButtonProps['size'];
  className?: string;
}

/**
 * Follow control per the DS Button spec (Figma: Design System | Protocol Labs,
 * node 27175-2517 — "Button", size Extra Small, style Border, type Secondary):
 * `size="xs" style="border" variant="neutral"`. Same look in both states —
 * only the icon and label change — matching that single reference component
 * rather than a bold CTA / quiet-following pair. Safe inside a card link — it
 * stops navigation itself.
 */
export function FollowPill({ following, onToggle, name, size = 'xs', className }: Props) {
  const glyph = size === 'xxs' ? 12 : 14;
  return (
    <Button
      size={size}
      style="border"
      variant="neutral"
      underline={false}
      className={clsx(s.btn, className)}
      aria-pressed={following}
      aria-label={following ? `Unfollow ${name}` : `Follow ${name}`}
      title={following ? 'Following — click to unfollow' : `Follow ${name} to get its updates in your feed`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
    >
      {following ? <CheckGlyph size={glyph} /> : <PlusGlyph size={glyph} />}
      <span>{following ? 'Following' : 'Follow'}</span>
    </Button>
  );
}

// Compact glyphs matching the DS Button's icon-slot scale.
const PlusGlyph = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

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
