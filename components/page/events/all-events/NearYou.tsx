import clsx from 'clsx';
import Link from 'next/link';

import btn from '@/components/common/Button/Button.module.scss';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { EventTile } from './EventCard';
import { PinIcon } from './icons';
import s from './AllEventsPage.module.scss';

/** "Near you in <city>": up to three tiles in the member's profile city, on a plain landing only. */
export function NearYou({
  city,
  events,
  todayIso,
  goingUids,
  onOpen,
  onPrepare,
  onSeeAll,
}: {
  city: string;
  events: AllEventsItem[];
  todayIso: string;
  goingUids: Set<string>;
  onOpen: (uid: string) => void;
  onPrepare: (uid: string) => void;
  onSeeAll: () => void;
}) {
  return (
    <section className={s.section} aria-labelledby="near-title">
      <div className={s.sectionHead}>
        <h2 id="near-title" className={s.sectionTitle}>
          Near you in {city}
        </h2>
        <button type="button" className={s.sectionLink} onClick={onSeeAll}>
          All {city} events
        </button>
      </div>
      <div className={clsx(s.tiles, s.nearTiles)}>
        {events.map((item) => (
          <EventTile
            key={item.uid}
            item={item}
            todayIso={todayIso}
            going={goingUids.has(item.uid)}
            onOpen={() => onOpen(item.uid)}
            onPrepare={() => onPrepare(item.uid)}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * No location on the profile: one row where Near you would be, asking for the field the profile already has
 * (Location), not a new setting. The button opens the member's profile; Browse by city still works without it.
 */
export function AddLocationRow({ profileHref }: { profileHref: string }) {
  return (
    <section className={clsx(s.section, s.askLocation)} aria-label="Events near you">
      <span className={s.askLocationIcon} aria-hidden>
        <PinIcon />
      </span>
      <p className={s.askLocationText}>
        <strong>See events near you.</strong> Add your location to your profile and we&apos;ll show what&apos;s coming
        up where you are.
      </p>
      <Link href={profileHref} className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.btn, s.askLocationBtn)}>
        Add location
      </Link>
    </section>
  );
}
