import clsx from 'clsx';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { AllEventsItem } from '@/services/events/all-events.types';

import s from './AllEventsPage.module.scss';

/**
 * Up to 3 faces and "N going", when the event shows its attendance and someone goes (LAB-3353): on List cards, Near you
 * tiles, Week cards and the map's rows. Nothing at 0, or when the event hides attendance (`goingCount` null).
 */
export function GoingFaces({ item, className }: { item: AllEventsItem; className?: string }) {
  const count = item.goingCount ?? 0;
  if (count === 0) return null;
  return (
    <span className={clsx(s.goingFaces, className)}>
      {item.faces.length > 0 && (
        <span className={s.facepile} aria-hidden>
          {item.faces.map((face) => (
            <img key={face.uid} src={face.image || getDefaultAvatar(face.name)} alt="" width={20} height={20} />
          ))}
        </span>
      )}
      <span className={s.cardCount}>{count} going</span>
    </span>
  );
}
