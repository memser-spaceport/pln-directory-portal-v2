import { clsx } from 'clsx';
import React, { ReactNode, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import { Menu } from '@base-ui-components/react/menu';
import { Dialog } from '@base-ui-components/react/dialog';

import { CloseIcon, PlusIcon, ChevronDownIcon } from '@/components/icons';

import s from './MobileFilterWrapper.module.scss';

export interface SortOption {
  value: string;
  label: string;
}

export interface MobileFilterWrapperProps {
  /**
   * Current filter count to display
   */
  filterCount: number;

  /**
   * Current sort value
   */
  currentSort: string;

  /**
   * Available sort options
   */
  sortOptions: SortOption[];

  /**
   * Handler for sort change
   */
  onSortChange: (sortValue: string) => void;

  /**
   * Render function for filter content
   */
  renderFilter: (onClose: () => void) => ReactNode;

  /**
   * Optional callback when filter panel is closed via X button or swipe
   */
  onFilterClose?: () => void;
}

/**
 * MobileFilterWrapper - Shared mobile filter and sort controls
 *
 * Provides consistent mobile UI across Members and Teams pages:
 * - Filter button with count badge
 * - Sort dropdown menu
 * - Bottom sheet dialog for filters
 * - Swipe-to-close functionality
 *
 * @example
 * ```tsx
 * <MobileFilterWrapper
 *   filterCount={5}
 *   currentSort="name,asc"
 *   sortOptions={[
 *     { value: 'name,asc', label: 'A-Z (Ascending)' },
 *     { value: 'name,desc', label: 'Z-A (Descending)' }
 *   ]}
 *   onSortChange={(sort) => setParam('sort', sort)}
 *   renderFilter={(onClose) => (
 *     <MyFilter onClose={onClose} />
 *   )}
 * />
 * ```
 */
export function MobileFilterWrapper({
  filterCount,
  currentSort,
  sortOptions,
  onSortChange,
  renderFilter,
  onFilterClose,
}: MobileFilterWrapperProps) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const handleFilterClick = () => {
    setIsFilterDrawerOpen(true);
  };

  const handleCloseFilterDrawer = () => {
    setIsFilterDrawerOpen(false);
  };

  const handleCloseWithCallback = () => {
    if (onFilterClose) {
      onFilterClose();
    }
    setIsFilterDrawerOpen(false);
  };

  const swipeHandlers = useSwipeable({
    onSwipedDown: () => {
      if (onFilterClose) {
        onFilterClose();
      }
      setIsFilterDrawerOpen(false);
    },
  });

  return (
    <>
      <div className={s.root}>
        <div className={s.header}>
          <button className={s.filtersButton} onClick={handleFilterClick}>
            <PlusIcon color="#455468" /> Filters
            {filterCount > 0 && <span>&nbsp;({filterCount})</span>}
          </button>
          <div className={s.rightSection}>
            {/* Sort Menu using base-ui */}
            <Menu.Root modal={false}>
              <Menu.Trigger className={s.filtersButton}>
                Sort <ChevronDownIcon color="#455468" />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner className={s.menuPositioner} align="end" sideOffset={8}>
                  <Menu.Popup className={s.menuPopup}>
                    {sortOptions.map((option) => (
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
          </div>
        </div>
      </div>

      <Dialog.Root open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={s.dialogBackdrop} />
          <Dialog.Popup className={s.dialogPopup}>
            <div className={s.dialogHandle} {...swipeHandlers} />
            <div className={s.dialogHeader} {...swipeHandlers}>
              <Dialog.Title className={s.dialogTitle}>Filters</Dialog.Title>
              <button className={s.dialogClose} onClick={handleCloseWithCallback}>
                <CloseIcon />
              </button>
            </div>
            <div className={s.dialogContent}>{renderFilter(handleCloseFilterDrawer)}</div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
