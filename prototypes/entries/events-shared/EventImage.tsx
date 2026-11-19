import clsx from 'clsx';

import { THUMBS } from '../event-drawer-redesign/mocks';

import g from './EventImage.module.scss';

/**
 * An event's picture, or a placeholder when the event has none (2026-11-18: "add a placeholder
 * image when no event image available"). Used everywhere a picture is drawn: list cards, Near you
 * tiles, the Week board's spanning cards, map venue pins and the drawer's thumbnail.
 *
 * The placeholder is the PL brand gradient (blue to green, as the Demo Day tag) with a white
 * calendar: an outline with a filled header band, two binding rings and one marked day. Middle
 * ground between a bare glyph and an illustration ("not so much, smth in the middle"). The slot
 * never collapses, so a card keeps its layout with or without a picture.
 *
 * `className` sizes it (it fills that box); `wide` asks for the 16:9 crop of the picture.
 */
export function EventImage({ uid, className, wide }: { uid: string; className?: string; wide?: boolean }) {
  const thumb = THUMBS[uid];
  if (thumb) {
    const src = wide ? thumb.replace('w=160&h=160', 'w=640&h=360') : thumb;
    return <img className={className} src={src} alt="" draggable={false} />;
  }
  return (
    <span className={clsx(className, g.placeholder)} aria-hidden>
      <svg viewBox="0 0 24 24" fill="none" className={g.mark}>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h12a2.5 2.5 0 0 1 2.5 2.5V10h-17z" fill="currentColor" />
        <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="15.5" cy="15.5" r="2" fill="currentColor" />
      </svg>
    </span>
  );
}
