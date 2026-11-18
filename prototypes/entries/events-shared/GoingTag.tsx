import clsx from 'clsx';

import g from './GoingTag.module.scss';

/**
 * "Going", one mark everywhere events appear in the prototypes (2026-11-18): the events page, Home's
 * events rail, the gathering modal, member and team profiles' Events, the digest's Upcoming events
 * and the event drawer's gathering rows. Before, the events page had a green-outlined DS success
 * Badge and everywhere else had `GoingMark`, a green tick with green text and no container.
 *
 * From Mobbin: Meetup's and Partiful's white pill on the event picture, Circle's solid green
 * check-circle. White pill; the one green thing is a filled check disc; the label is the page's dark
 * ink. `label` keeps the sentence each place needs ("You're going", "You're going too").
 * `onImage` floats it on a tile's picture (shadow, no border); in flow it takes the card border.
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
      <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden className={g.mark}>
        <circle cx="8" cy="8" r="8" fill="currentColor" />
        <path
          d="M4.75 8.25l2.1 2.1 4.4-4.6"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  );
}
