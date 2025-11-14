import React from 'react';
import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import { ChevronDownIcon } from '@/components/icons';
import s from './MobileFilterControls.module.scss';

export interface SortOption {
  value: string;
  label: string;
}

export interface MobileSortMenuProps {
  options: SortOption[];
  currentSort: string;
  onSortChange: (sort: string) => void;
  className?: string;
}

/**
 * Mobile Sort Menu
 *
 * Reusable dropdown menu for sorting options on mobile
 */
export function MobileSortMenu({ options, currentSort, onSortChange, className }: MobileSortMenuProps) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={clsx(s.filterButton, className)}>
        Sort <ChevronDownIcon color="#455468" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={s.menuPositioner} align="end" sideOffset={8}>
          <Menu.Popup className={s.menuPopup}>
            {options.map((option) => (
              <Menu.Item
                key={option.value}
                className={clsx(s.menuItem, {
                  [s.active]: currentSort === option.value,
                })}
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
}
