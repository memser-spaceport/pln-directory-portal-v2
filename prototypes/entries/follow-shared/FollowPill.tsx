'use client';

import { Button } from '@/components/common/Button';

import s from './FollowPill.module.scss';

interface Props {
  following: boolean;
  onToggle: () => void;
  /** What you're following — used in the accessible label. */
  name: string;
}

/**
 * Follow control per the DS Button spec (Figma: Design System | Protocol Labs,
 * node 27175-2517 — "Button", size Extra Small, style Border, type Secondary):
 * `size="xs" style="border" variant="neutral"`. Same look in both states —
 * only the icon and label change — matching that single reference component
 * rather than a bold CTA / quiet-following pair. Safe inside a card link — it
 * stops navigation itself.
 */
export function FollowPill({ following, onToggle, name }: Props) {
  return (
    <Button
      size="xs"
      style="border"
      variant="neutral"
      underline={false}
      className={s.btn}
      aria-pressed={following}
      aria-label={following ? `Unfollow ${name}` : `Follow ${name}`}
      title={following ? 'Following — click to unfollow' : `Follow ${name} to get its updates in your feed`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
    >
      {following ? <CheckGlyph /> : <PlusGlyph />}
      <span>{following ? 'Following' : 'Follow'}</span>
    </Button>
  );
}

// Compact glyphs matching the DS Button's icon-slot scale.
const PlusGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CheckGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M13.25 4.75 6.5 11.5 2.75 7.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
