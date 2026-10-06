'use client';

import React, { useRef } from 'react';
import clsx from 'clsx';

// Production's single-select pill row, exactly as the Contact support form wears
// it (`components/ContactSupport/TopicPills`): the search-category chip, bordered
// neutral at rest, brand-filled when chosen. Both stylesheets imported verbatim.
import sc from '@/components/core/application-search/components/SearchCategories/SearchCategories.module.scss';
import tp from '@/components/ContactSupport/TopicPills.module.scss';

export interface KindOption {
  label: string;
  value: string;
}

interface Props {
  options: KindOption[];
  value: string;
  onChange: (option: KindOption) => void;
  'aria-labelledby'?: string;
}

/**
 * COPY of production `TopicPills` with the options passed in (production's is
 * wired to the five support topics). Same markup, same radiogroup keys.
 *
 * Why pills here (polish, 2026-10-05): Kind was a select holding four one-word
 * values, so three of the four cost a press to even see — the case TopicPills
 * was built to fix in the support form ("A dropdown made four of the five topics
 * cost a press to even see"). Skiff's and Dropbox Dash's feedback forms put the
 * kind on screen the same way.
 */
export function KindPills({ options, value, onChange, 'aria-labelledby': labelledBy }: Props) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const tabbableIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length;
    onChange(options[next]);
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
    <div role="radiogroup" aria-labelledby={labelledBy} className={clsx(sc.root, tp.pillRow)}>
      {options.map((option, index) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={index === tabbableIndex ? 0 : -1}
            className={clsx(sc.categoryBadge, tp.pill, active && sc.active)}
            onClick={() => onChange(option)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
