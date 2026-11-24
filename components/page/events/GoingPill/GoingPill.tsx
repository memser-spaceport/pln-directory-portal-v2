import clsx from 'clsx';

import s from './GoingPill.module.scss';

/**
 * "Going" (LAB-3247): a filled green pill with a white tick, ported from the prototype's
 * `events-shared/GoingTag` (its 2026-11-18 version). On All Events it is the one going mark; Home, the profiles and
 * the digest keep theirs until a follow-up ticket. `onImage` floats it on a tile's picture with a thin white ring.
 */
export function GoingPill({
  label = 'Going',
  onImage,
  className,
}: {
  label?: string;
  onImage?: boolean;
  className?: string;
}) {
  return (
    <span className={clsx(s.tag, onImage && s.onImage, className)}>
      <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden className={s.mark} data-going="">
        <path
          d="M3.5 8.5l3 3 6-6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  );
}
