import clsx from 'clsx';
import type { KeyboardEvent, SyntheticEvent } from 'react';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { AllEventsItem } from '@/services/events/all-events.types';

import s from './AllEventsPage.module.scss';

/**
 * Up to 3 faces and "N going", when the event shows its attendance and someone goes (LAB-3353): on List cards, Near you
 * tiles, Week cards and the map's rows. "N went" for a past event (LAB-3418). Nothing at 0, or when the event hides
 * attendance (`goingCount` null). The faces load near the screen only: Past has hundreds of cards (LAB-3418).
 *
 * With `onOpenPeople` (a List card on Past, LAB-3418 design decision P1, Polina's LAB-3424 design) the faces and the
 * count are one press that opens who went, not the card's own press. The card is itself a button, so this is a
 * `role="button"` span, as in the prototype's `EventFoot`.
 */
export function GoingFaces({
  item,
  past = false,
  className,
  onOpenPeople,
}: {
  item: AllEventsItem;
  past?: boolean;
  className?: string;
  onOpenPeople?: () => void;
}) {
  const count = item.goingCount ?? 0;
  if (count === 0) return null;
  const press = (e: SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onOpenPeople?.();
  };
  const people = onOpenPeople
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': `${past ? 'See who went' : "See who's going"}: ${count} ${count === 1 ? 'person' : 'people'}`,
        onClick: press,
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') press(e);
        },
      }
    : {};
  return (
    <span className={clsx(s.goingFaces, onOpenPeople && s.goingLink, className)} {...people}>
      {item.faces.length > 0 && (
        <span className={s.facepile} aria-hidden>
          {item.faces.map((face) => (
            <img
              key={face.uid}
              src={face.image || getDefaultAvatar(face.name)}
              alt=""
              width={20}
              height={20}
              loading="lazy"
            />
          ))}
        </span>
      )}
      <span className={s.cardCount}>
        {count} {past ? 'went' : 'going'}
      </span>
    </span>
  );
}
