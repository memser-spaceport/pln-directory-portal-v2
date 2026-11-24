import clsx from 'clsx';

import s from './EventImage.module.scss';

/**
 * An event's picture, or the brand placeholder when it has none (LAB-3247, from the prototype's
 * `events-shared/EventImage`): the PL gradient with a white calendar. `className` sizes it; the slot never collapses,
 * so a card keeps its layout with or without a picture.
 */
export function EventImage({ src, className }: { src: string | null | undefined; className?: string }) {
  if (src) return <img className={className} src={src} alt="" draggable={false} loading="lazy" />;
  return (
    <span className={clsx(className, s.placeholder)} aria-hidden data-testid="event-image-placeholder">
      <svg viewBox="0 0 24 24" fill="none" className={s.mark}>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h12a2.5 2.5 0 0 1 2.5 2.5V10h-17z" fill="currentColor" />
        <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="15.5" cy="15.5" r="2" fill="currentColor" />
      </svg>
    </span>
  );
}
