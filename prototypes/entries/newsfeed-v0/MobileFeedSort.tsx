'use client';

import clsx from 'clsx';
import { Menu } from '@base-ui-components/react/menu';

import { ChevronDownIcon } from '@/components/icons';

// Reuse the Teams/Members mobile sort styling 1:1 — "Sort by: {value} ▾" pill
// + base-ui menu, exactly as MobileFilterWrapper renders it.
import mf from '@/components/common/filters/MobileFilterWrapper/MobileFilterWrapper.module.scss';

interface Option {
  value: string;
  label: string;
}

interface MobileFeedSortProps {
  options: readonly Option[];
  currentSort: string;
  onSortChange: (value: string) => void;
}

/**
 * Mobile sort control matching the Teams/Members pages: a "Sort by:" label next
 * to a pill showing the current value, opening a base-ui menu of options.
 */
export function MobileFeedSort({ options, currentSort, onSortChange }: MobileFeedSortProps) {
  const current = options.find((o) => o.value === currentSort)?.label ?? options[0]?.label;

  return (
    <span className={mf.rightSection}>
      <span className={mf.sortByLabel}>Sort by:</span>
      <Menu.Root modal={false}>
        <Menu.Trigger className={mf.filtersButton}>
          {current} <ChevronDownIcon color="#455468" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={mf.menuPositioner} align="end" sideOffset={8}>
            <Menu.Popup className={mf.menuPopup}>
              {options.map((option) => (
                <Menu.Item
                  key={option.value}
                  className={clsx(mf.menuItem, currentSort === option.value && mf.active)}
                  onClick={() => onSortChange(option.value)}
                >
                  {option.label}
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </span>
  );
}
