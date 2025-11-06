import { clsx } from 'clsx';
import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import { Menu } from '@base-ui-components/react/menu';
import { Dialog } from '@base-ui-components/react/dialog';

import { SORT_OPTIONS } from '@/utils/constants';
import { useFilterStore } from '@/services/members/store';
import { MembersFilter } from '@/components/page/members/MembersFilter';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';
import { CloseIcon, PlusIcon, ChevronDownIcon } from '@/components/icons';

import s from './MembersMobileFilters.module.scss';

interface MembersMobileFiltersProps {
  filterValues?: any;
  userInfo?: any;
  isUserLoggedIn?: boolean;
  searchParams?: any;
}

export const MembersMobileFilters = ({
  filterValues,
  userInfo,
  isUserLoggedIn,
  searchParams: propsSearchParams,
}: MembersMobileFiltersProps) => {
  const { params, setParam } = useFilterStore();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const currentSort = params.get('sort') || SORT_OPTIONS.ASCENDING;

  // Calculate filter count
  const filterCount = useGetMembersFilterCount();

  // Handler functions
  const handleSortChange = (sortOption: string) => {
    setParam('sort', sortOption);
  };

  const handleFilterClick = () => {
    setIsFilterDrawerOpen(true);
  };

  const handleCloseFilterDrawer = () => {
    setIsFilterDrawerOpen(false);
  };

  const swipeHandlers = useSwipeable({
    onSwipedDown: () => setIsFilterDrawerOpen(false),
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
                    <Menu.Item
                      className={clsx(s.menuItem, {
                        [s.active]: currentSort === SORT_OPTIONS.ASCENDING,
                      })}
                      onClick={() => handleSortChange(SORT_OPTIONS.ASCENDING)}
                    >
                      A-Z (Ascending)
                    </Menu.Item>
                    <Menu.Item
                      className={clsx(s.menuItem, {
                        [s.active]: currentSort === SORT_OPTIONS.DESCENDING,
                      })}
                      onClick={() => handleSortChange(SORT_OPTIONS.DESCENDING)}
                    >
                      Z-A (Descending)
                    </Menu.Item>
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
              <Dialog.Close className={s.dialogClose}>
                <CloseIcon />
              </Dialog.Close>
            </div>
            <div className={s.dialogContent}>
              <MembersFilter
                filterValues={filterValues}
                userInfo={userInfo}
                isUserLoggedIn={isUserLoggedIn}
                searchParams={propsSearchParams}
                onClose={handleCloseFilterDrawer}
              />
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
