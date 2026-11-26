import React from 'react';
import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import s from './SortDropdown.module.scss';

export interface SortOption {
  value: string;
  label: React.ReactNode;
  /** Shown in the trigger instead of `label` once selected. */
  selectedLabel?: React.ReactNode;
}

interface SortDropdownProps {
  options: readonly SortOption[];
  currentSort: string;
  onSortChange: (sort: string) => void;
  className?: string;
  /** When set, shows this text before the dropdown (e.g. "Sort by:"). */
  sortByLabel?: string;
  /** The trigger's accessible name, when its text alone doesn't say what it changes. */
  ariaLabel?: string;
  /** The trigger's edge the menu lines up with. */
  align?: 'start' | 'end';
}

export function SortDropdown({
  options,
  currentSort,
  onSortChange,
  className,
  sortByLabel,
  ariaLabel,
  align = 'end',
}: SortDropdownProps) {
  const currentOption = options.find((o) => o.value === currentSort) ?? options[0];
  const currentLabel = currentOption?.selectedLabel ?? currentOption?.label;

  const dropdown = (
    <Menu.Root modal={false}>
      <Menu.Trigger className={clsx(s.trigger, className)} aria-label={ariaLabel}>
        {currentLabel}
        <svg className={s.caret} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={s.positioner} align={align} sideOffset={4}>
          <Menu.Popup className={clsx(s.menu, align === 'start' && s.menuStart)}>
            {options.map((option) => (
              <Menu.Item
                key={option.value}
                className={clsx(s.option, currentSort === option.value && s.optionActive)}
                onClick={() => onSortChange(option.value)}
              >
                {option.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );

  if (!sortByLabel) {
    return dropdown;
  }

  return (
    <div className={s.sortGroup}>
      <span className={s.sortByLabel}>{sortByLabel}</span>
      {dropdown}
    </div>
  );
}
