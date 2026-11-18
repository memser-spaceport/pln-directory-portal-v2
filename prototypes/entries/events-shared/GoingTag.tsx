import clsx from 'clsx';

import g from './GoingTag.module.scss';

/**
 * "Going", one mark everywhere events appear in the prototypes (2026-11-18): the events page, Home's
 * events rail, the gathering modal, member and team profiles' Events, the digest's Upcoming events
 * and the event drawer's gathering rows. Before, the events page had a green-outlined DS success
 * Badge and everywhere else had `GoingMark`, a green tick with green text and no container.
 *
 * From Mobbin: Meetup's and Partiful's pill on the event picture, Luma's solid green "Going".
 * Since 2026-11-18 a filled green pill with a white tick and label (it was a white pill with a
 * green check disc). `label` keeps the sentence each place needs ("You're going", "You're going too").
 * `onImage` floats it on a tile's picture with a thin white ring.
 */
export function GoingTag({
  label = 'Going',
  onImage,
  className,
}: {
  label?: string;
  onImage?: boolean;
  className?: string;
}) {
  return (
    <span className={clsx(g.tag, onImage && g.onImage, className)}>
      {/* data-going: a stable hook for tests and screenshots (the mark has no disc any more). */}
      <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden className={g.mark} data-going="">
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
