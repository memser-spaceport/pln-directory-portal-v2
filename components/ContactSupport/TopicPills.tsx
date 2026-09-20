'use client';

import React, { useRef } from 'react';
import clsx from 'clsx';

// Production's single-select pill row — the category chips over search results
// (Top / Members / Teams …): bordered neutral at rest, brand-filled when
// chosen, brand border on hover. Its stylesheet is imported so this row tracks
// production rather than growing a second look for the same control.
import sc from '@/components/core/application-search/components/SearchCategories/SearchCategories.module.scss';

import { CONTACT_SUPPORT_TOPICS } from './constants';

import s from './TopicPills.module.scss';

interface Props {
  value: string;
  onChange: (topic: string) => void;
}

/**
 * The five topics as pills, in place of the "Please choose topic below"
 * dropdown the support form used to open with.
 *
 * Same five values, same order, same chip component the product already had —
 * only the *visibility* changes. A dropdown made four of the five topics cost a
 * press to even see, and PostHog says that press was never spent (12
 * non-default topics across 605 opens in 90 days). Pills put the whole offer on
 * screen at rest, so someone who arrived through the header menu sees their
 * choice confirmed, and someone who arrived through another door — an auth
 * error, the forum's signed-out view, a `?dialog=` link — sees what else they
 * could be sending.
 */
export function TopicPills({ value, onChange }: Props) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedIndex = CONTACT_SUPPORT_TOPICS.findIndex((topic) => topic.value === value);
  // A radiogroup must always have exactly one tab stop. If `value` is somehow
  // not one of ours, the first pill takes it rather than the row falling out of
  // the tab order entirely.
  const tabbableIndex = selectedIndex === -1 ? 0 : selectedIndex;

  // Arrow keys move focus and selection together, which is what `radiogroup`
  // promises: once the row is one tab stop, Tab can no longer reach the other
  // four, so something else has to.
  const move = (from: number, delta: number) => {
    const count = CONTACT_SUPPORT_TOPICS.length;
    const next = (from + delta + count) % count;
    onChange(CONTACT_SUPPORT_TOPICS[next].value);
    refs.current[next]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      move(index, 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(index, -1);
    }
  };

  return (
    <div role="radiogroup" aria-label="Topic" className={clsx(sc.root, s.pillRow)}>
      {CONTACT_SUPPORT_TOPICS.map((topic, index) => {
        const active = topic.value === value;

        return (
          <button
            key={topic.dialogParam}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={index === tabbableIndex ? 0 : -1}
            className={clsx(sc.categoryBadge, s.pill, active && sc.active)}
            onClick={() => onChange(topic.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {topic.label}
          </button>
        );
      })}
    </div>
  );
}
