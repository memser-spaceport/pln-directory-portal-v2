'use client';

import clsx from 'clsx';
import { Button } from '@/components/common/Button';
import { ChevronDownIcon } from '@/components/icons';

import s from './FollowButton.module.scss';

interface Props {
  following: boolean;
  /** Generic click — the parent decides whether this follows or opens a menu. */
  onClick: () => void;
  /** Follower count shown next to (or under) the button. Omit to hide. */
  count?: number;
  /** What you're following — used in the accessible label. */
  name: string;
  size?: 'xs' | 's' | 'm';
  /** Full-width button with the count stacked beneath (for cards). */
  block?: boolean;
  /** Show a ▾ caret on the following state (signals a menu opens on click). */
  caret?: boolean;
  /** Show a bell icon on the not-following state. */
  bell?: boolean;
  /** Tertiary: a small no-fill text button (e.g. inline next to a name). */
  tertiary?: boolean;
  /** Link: a pure DS grey text-link button (no fill/border). */
  link?: boolean;
  /** Secondary: an outlined (bordered) button instead of the solid primary. */
  secondary?: boolean;
  /** Glossy: the "Schedule Meeting" treatment — inset highlights + brand glow. */
  glossy?: boolean;
  /** Marks the button as a menu trigger for assistive tech. */
  menuExpanded?: boolean;
}

/**
 * Presentational follow button. Not-following is a solid primary CTA; following
 * is a quiet neutral pill. Behavior (follow vs. open-menu vs. unfollow) lives in
 * the parent so the same button works for profile controls and lightweight chips.
 */
export function FollowButton({
  following,
  onClick,
  count,
  name,
  size = 's',
  block,
  caret,
  bell,
  tertiary,
  link,
  secondary,
  glossy,
  menuExpanded,
}: Props) {
  // link = pure DS grey text-link button; tertiary = the custom compact text
  // button; secondary = DS blue outlined; else solid primary.
  const btnStyle = tertiary || link ? 'link' : secondary || following ? 'border' : 'fill';
  const btnVariant = link ? 'secondary' : following ? 'neutral' : tertiary ? 'neutral' : 'primary';

  return (
    <div className={clsx(s.root, { [s.block]: block })}>
      <Button
        size={size}
        style={btnStyle}
        variant={btnVariant}
        underline={false}
        className={clsx(s.btn, {
          [s.blockBtn]: block,
          [s.tertiary]: tertiary,
          [s.tertiaryFollow]: tertiary && !following,
          [s.glossy]: glossy && !following && !secondary,
        })}
        onClick={onClick}
        aria-haspopup={following && caret ? 'menu' : undefined}
        aria-expanded={following && caret ? menuExpanded : undefined}
        aria-label={following ? `Following ${name}` : `Follow ${name}`}
      >
        {following ? <CheckGlyph className={s.icon} /> : bell ? <PlusGlyph /> : null}
        <span>{following ? 'Following' : 'Follow'}</span>
        {following && caret && <ChevronDownIcon className={s.caret} width={14} height={14} aria-hidden="true" />}
      </Button>

      {typeof count === 'number' && (
        <span className={s.count} aria-live="polite">
          <span key={count} className={s.countNum}>
            {count.toLocaleString()}
          </span>{' '}
          {count === 1 ? 'follower' : 'followers'}
        </span>
      )}
    </div>
  );
}

// Bare plus (no surrounding circle) for the Follow state.
const PlusGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// A lighter, more elegant check for the Following state.
const CheckGlyph = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M13.25 4.75 6.5 11.5 2.75 7.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
