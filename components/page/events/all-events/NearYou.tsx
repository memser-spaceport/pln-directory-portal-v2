import clsx from 'clsx';
import type { ReactNode } from 'react';

import btn from '@/components/common/Button/Button.module.scss';
import type { AllEventsItem } from '@/services/events/all-events.types';

import { EventTile } from './EventCard';
import { PinIcon } from './icons';
import s from './AllEventsPage.module.scss';

/**
 * "Near you in <city>": up to three tiles in the member's profile city, on the plain List (a chosen city replaces it).
 * "Change" beside the heading opens the location dialog (LAB-3394).
 */
export function NearYou({
  city,
  events,
  todayIso,
  goingUids,
  onOpen,
  onPrepare,
  onSeeAll,
  onChangeLocation,
}: {
  city: string;
  events: AllEventsItem[];
  todayIso: string;
  goingUids: Set<string>;
  onOpen: (uid: string) => void;
  onPrepare: (uid: string) => void;
  onSeeAll: () => void;
  onChangeLocation: () => void;
}) {
  return (
    <section className={s.section} aria-labelledby="near-title">
      <div className={s.sectionHead}>
        <div className={s.nearTitle}>
          <h2 id="near-title" className={s.sectionTitle}>
            Near you in {city}
          </h2>
          <button
            type="button"
            className={s.changeLocation}
            onClick={onChangeLocation}
            aria-label="Change your location"
          >
            Change
          </button>
        </div>
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

/** The row Near you gives way to: a pin, a line of text, and one button that opens the location dialog (LAB-3394). */
function LocationRow({
  label,
  children,
  action,
  onAction,
}: {
  label: string;
  children: ReactNode;
  action: string;
  onAction: () => void;
}) {
  return (
    <section className={clsx(s.section, s.askLocation)} aria-label={label}>
      <span className={s.askLocationIcon} aria-hidden>
        <PinIcon />
      </span>
      <p className={s.askLocationText}>{children}</p>
      <button
        type="button"
        onClick={onAction}
        className={clsx(btn.root, btn.small, btn.border, btn.neutral, s.btn, s.askLocationBtn)}
      >
        {action}
      </button>
    </section>
  );
}

/**
 * No location on the profile: one row where Near you would be, asking for the field the profile already has
 * (Location), not a new setting. "Add location" opens the location dialog (LAB-3394); Browse by city still works
 * without it.
 */
export function AddLocationRow({ onAdd }: { onAdd: () => void }) {
  return (
    <LocationRow label="Events near you" action="Add location" onAction={onAdd}>
      <strong>See events near you.</strong> Add your location to your profile and we&apos;ll show what&apos;s coming up
      where you are.
    </LocationRow>
  );
}

/**
 * A location with no upcoming event in it (LAB-3394): without this row Near you would simply not show, and the member
 * would have nowhere on the page to change the place.
 */
export function NoNearbyEventsRow({ city, onChange }: { city: string; onChange: () => void }) {
  return (
    <LocationRow label="Events near you" action="Change location" onAction={onChange}>
      <strong>No upcoming events near {city}.</strong> Browse other cities below, or change your location.
    </LocationRow>
  );
}
