'use client';

/**
 * The read side of the same field.
 *
 * If Location is the only place travel is stored, it has to be the place travel
 * is *read* too — otherwise a visitor can see where someone lives but not that
 * they'll be in Berlin next week, which is the entire point. So the header's
 * location strip gains one chip after the city.
 *
 * MemberDetailHeader.tsx:149-173 already renders `divider + location` inside a
 * flex strip, so this is one more item in a row that exists — no new real estate.
 *
 * Three rules:
 *  - The chip is in the tense of the stay. Someone in Berlin today reads
 *    "In Berlin · until Aug 27", not a future-looking "Berlin · Aug 25-27" with
 *    a NOW pill hidden one press away.
 *  - It only opens when the list holds something the chip doesn't: more stays,
 *    or a note. One stay with no note used to open a popover repeating the chip.
 *  - If the viewer's own dates cross it, it says so — that is what the dates
 *    are for.
 */

import { useEffect, useRef, useState } from 'react';
import { getFormattedDateString } from '@/utils/irl.utils';
import type { Trip } from './mocks';
import tag from '@/components/ui/Tag/Tag.module.scss';
import { ChevronDownIcon } from '@/components/icons';
import { PlaneIcon } from './icons';
import { parseKey, shortMonth } from './presence';
import s from './LocationField.module.scss';

interface UpcomingChipProps {
  stays: Trip[];
  /** the day the page is being read on */
  todayKey: string;
  /** the visitor's own whereabouts — omitted on your own profile */
  viewer?: { homeCity: string; stays: Trip[] };
}

/** "until Aug 27" — the end date alone; the year is never in doubt for a stay in progress. */
function untilLabel(endDate: string): string {
  return `until ${shortMonth(endDate)} ${parseKey(endDate).day}`;
}

export function UpcomingChip({ stays, todayKey, viewer }: UpcomingChipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  // Everything still to come, including a stay already in progress.
  const ahead = stays.filter((stay) => stay.endDate >= todayKey).sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (ahead.length === 0) return null;

  const next = ahead[0];
  const later = ahead.length - 1;
  const isNow = (stay: Trip) => stay.startDate <= todayKey;
  const label = (stay: Trip) =>
    isNow(stay)
      ? `In ${stay.city} · ${untilLabel(stay.endDate)}`
      : `${stay.city} · ${getFormattedDateString(stay.startDate, stay.endDate)}`;

  const hasMore = later > 0 || ahead.some((stay) => stay.note);

  // Will the visitor be in the same city on any of those days? Either they live
  // there or one of their own stays crosses it.
  const sharesNext =
    viewer &&
    (viewer.homeCity === next.city ||
      viewer.stays.some(
        (mine) => mine.city === next.city && mine.startDate <= next.endDate && mine.endDate >= next.startDate,
      ));

  const body = (
    <>
      {/* 12px, to sit with the 12px chip text and the 12px caret. */}
      <PlaneIcon fill="#1B4DFF" size={12} />
      {label(next)}
      {/* The grey "+N" is `Tag variant="primary"` — what TagsList.tsx:46 renders
          for the skills overflow in this same header. Its SCSS is reused rather
          than the component, because Tag renders a <button> and this sits
          inside one. */}
      {later > 0 && <span className={`${tag.root} ${tag.primary}`}>+{later}</span>}
    </>
  );

  return (
    <span className={s.chipWrap} ref={rootRef}>
      {hasMore ? (
        <button type="button" className={s.chip} onClick={() => setOpen((current) => !current)}>
          {body}
          {/* The DS disclosure glyph says "this opens something" at rest, and
              rotating it doubles as the open/closed state. Only drawn when
              there is something to open. */}
          <ChevronDownIcon
            width={12}
            height={12}
            className={`${s.chipCaret} ${open ? s.chipCaretOpen : ''}`}
            aria-hidden
          />
        </button>
      ) : (
        <span className={`${s.chip} ${s.chipStatic}`}>{body}</span>
      )}

      {sharesNext && <span className={s.chipShared}>You&apos;ll be there too</span>}

      {open && (
        <div className={s.popover}>
          <p className={s.popoverTitle}>Other locations</p>
          <ul className={s.popoverList}>
            {ahead.map((stay) => (
              <li key={stay.id} className={s.popoverRow}>
                <span className={s.popoverHead}>
                  <span className={s.popoverCity}>{stay.city}</span>
                  <span className={s.popoverDates}>
                    {isNow(stay)
                      ? `Now, ${untilLabel(stay.endDate)}`
                      : getFormattedDateString(stay.startDate, stay.endDate)}
                  </span>
                </span>
                {/* The note is the reason to reach out — "open for coffee" is
                    more actionable than the dates. */}
                {stay.note && <span className={s.popoverNote}>{stay.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
}
