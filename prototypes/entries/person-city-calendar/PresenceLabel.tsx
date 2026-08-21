'use client';

/**
 * The one definition of the city + dates label.
 *
 * Every surface that shows "where is this person" renders this: the member card,
 * the profile-header mock, the trip list, the city cards. Keeping it in one
 * component is the point — production currently has the same label logic
 * duplicated between the member card, the member list row and the IRL guest row,
 * and they have already drifted.
 *
 * At home  ->  [pin]   Lisbon, Portugal          (identical to production today)
 * Away     ->  [plane] Berlin · Aug 24-28 '26
 */

import { getFormattedDateString } from '@/utils/irl.utils';
import type { Presence } from './presence';
import { LocationIcon, PlaneIcon } from './icons';
import s from './PresenceLabel.module.scss';

interface PresenceLabelProps {
  presence: Presence;
  /** the person's declared home, used for the secondary line */
  home: { city: string; country: string };
  /** 'card' matches the production member card exactly; 'header' is the roomier profile treatment */
  variant?: 'card' | 'header' | 'inline';
  /** show the muted "Home: Lisbon" second line — only the detail page has room */
  showHomeHint?: boolean;
  /** omit the date range (used where the surrounding row already states it) */
  hideDates?: boolean;
}

export function PresenceLabel(props: PresenceLabelProps) {
  const { presence, home, variant = 'card', showHomeHint = false, hideDates = false } = props;
  const { trip } = presence;

  // At home: unchanged from production — `parseMemberLocation` renders
  // "City, Country" and the pin sits in the same 4px-gap flex row.
  if (!trip) {
    return (
      <span className={`${s.root} ${s[variant]}`}>
        <span className={s.row}>
          <LocationIcon />
          <span className={s.text}>
            {presence.city}
            {presence.country ? `, ${presence.country}` : ''}
          </span>
        </span>
      </span>
    );
  }

  const range = getFormattedDateString(trip.startDate, trip.endDate);

  return (
    <span className={`${s.root} ${s[variant]}`}>
      <span className={s.row}>
        <PlaneIcon />
        <span className={`${s.text} ${s.awayText}`}>
          {presence.city}
          {hideDates ? '' : ` · ${range}`}
        </span>
      </span>
      {showHomeHint && <span className={s.homeHint}>Home: {home.city}</span>}
    </span>
  );
}
