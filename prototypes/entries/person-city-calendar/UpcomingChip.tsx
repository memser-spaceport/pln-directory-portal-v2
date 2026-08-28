'use client';

/**
 * The read side of the same field.
 *
 * If Location is the only place travel is stored, it has to be the place travel
 * is *read* too — otherwise a visitor can see where someone lives but not that
 * they'll be in Berlin next week, which is the entire point. So the header's
 * location strip gains one chip after the city, and the chip opens the list.
 *
 * MemberDetailHeader.tsx:149-173 already renders `divider + location` inside a
 * flex strip, so this is one more item in a row that exists — no new real estate.
 */

import { useEffect, useRef, useState } from 'react';
import { getFormattedDateString } from '@/utils/irl.utils';
import type { Trip } from './mocks';
import tag from '@/components/ui/Tag/Tag.module.scss';
import { ChevronDownIcon } from '@/components/icons';
import { PlaneIcon } from './icons';
import s from './LocationField.module.scss';

interface UpcomingChipProps {
  stays: Trip[];
  /** the day the page is being read on */
  todayKey: string;
}

export function UpcomingChip({ stays, todayKey }: UpcomingChipProps) {
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

  // Everything still to come, including a stay already in progress — someone
  // who is in Berlin *right now* is exactly who you want the note and the
  // return date for. Dropping the current stay meant a travelling member's
  // profile had no popover at all.
  const ahead = stays.filter((stay) => stay.endDate >= todayKey).sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (ahead.length === 0) return null;

  const next = ahead[0];
  const later = ahead.length - 1;

  return (
    <span className={s.chipWrap} ref={rootRef}>
      <button type="button" className={s.chip} onClick={() => setOpen((current) => !current)}>
        {/* 12px, to sit with the 12px chip text and the 12px caret — a 16px
            glyph next to 18px line-height was the other half of "broken". */}
        <PlaneIcon fill="#1B4DFF" size={12} />
        {next.city} · {getFormattedDateString(next.startDate, next.endDate)}
        {/* The grey "+N" already exists as `Tag variant="primary"` — #f1f5f9 on
            #475569, 2px 5px, 24px radius, 12px/500/14px. It is what
            TagsList.tsx:46 renders for the skills overflow in this same header,
            and what member-skill-list, SkillsList and member-details-team-card
            all use. Its SCSS is reused rather than the component, because Tag
            renders a <button> and this sits inside one — the sanctioned
            "reuse the module, not the component" case (prototypes/CLAUDE.md). */}
        {later > 0 && <span className={`${tag.root} ${tag.primary}`}>+{later}</span>}
        {/* The affordance. Hover was doing this work, and there is no hover on a
            phone — the chip otherwise reads as a static badge, which is exactly
            what the "from Protocol Berg" and Tag pills next to it are. The DS
            disclosure glyph (ChevronDownIcon, as used by MobileSortMenu,
            NavItemWithMenu and the FAQ accordions) says "this opens something"
            at rest, and rotating it doubles as the open/closed state. */}
        <ChevronDownIcon
          width={12}
          height={12}
          className={`${s.chipCaret} ${open ? s.chipCaretOpen : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className={s.popover}>
          <p className={s.popoverTitle}>Where they&apos;ll be</p>
          <ul className={s.popoverList}>
            {ahead.map((stay) => (
              <li key={stay.id} className={s.popoverRow}>
                <span className={s.popoverHead}>
                  <span className={s.popoverCity}>{stay.city}</span>
                  <span className={s.popoverDates}>{getFormattedDateString(stay.startDate, stay.endDate)}</span>
                  {stay.startDate <= todayKey && <span className={s.popoverNow}>Now</span>}
                </span>
                {/* The note is the reason to reach out — "open for coffee" is
                    more actionable than the dates. It was only visible to the
                    author in their own edit list, which made it write-only. */}
                {stay.note && <span className={s.popoverNote}>{stay.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
}
