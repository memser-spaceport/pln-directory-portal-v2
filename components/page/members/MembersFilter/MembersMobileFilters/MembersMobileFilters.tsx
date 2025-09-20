import { clsx } from 'clsx';
import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import { Menu } from '@base-ui-components/react/menu';
import { Dialog } from '@base-ui-components/react/dialog';

import { VIEW_TYPE_OPTIONS, SORT_OPTIONS, URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { useFilterStore } from '@/services/members/store';
import { MembersFilter } from '@/components/page/members/MembersFilter';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';

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

  const view = params.get('viewType') || VIEW_TYPE_OPTIONS.GRID;
  const currentSort = params.get('sort') || SORT_OPTIONS.ASCENDING;

  // Get applied filters for count and badges
  const appliedTopics = params.get('topics')?.split(URL_QUERY_VALUE_SEPARATOR) || [];
  const appliedRoles = params.get('roles')?.split(URL_QUERY_VALUE_SEPARATOR) || [];
  const appliedSearchRoles = params.get('searchRoles')?.split(URL_QUERY_VALUE_SEPARATOR) || [];
  const hasOfficeHours = params.get('hasOfficeHours') === 'true';
  const includeFriends = params.get('includeFriends') === 'true';
  const search = !!params.get('search');

  // Calculate filter count
  const filterCount = useGetMembersFilterCount();

  // Handler functions
  const handleViewChange = (newView: string) => {
    setParam('viewType', newView);
  };

  const handleSortChange = (sortOption: string) => {
    setParam('sort', sortOption);
  };

  const handleFilterClick = () => {
    setIsFilterDrawerOpen(true);
  };

  const handleCloseFilterDrawer = () => {
    setIsFilterDrawerOpen(false);
  };

  // Badge removal handlers
  const handleRemoveTopicBadge = (topic: string) => {
    const newTopics = appliedTopics.filter((t) => t !== topic);
    setParam('topics', newTopics.length > 0 ? newTopics.join(URL_QUERY_VALUE_SEPARATOR) : undefined);
  };

  const handleRemoveRoleBadge = (role: string) => {
    const newRoles = appliedRoles.filter((r) => r !== role);
    setParam('roles', newRoles.length > 0 ? newRoles.join(URL_QUERY_VALUE_SEPARATOR) : undefined);
  };

  const handleRemoveSearchRoleBadge = (role: string) => {
    const newSearchRoles = appliedSearchRoles.filter((r) => r !== role);
    setParam('searchRoles', newSearchRoles.length > 0 ? newSearchRoles.join(URL_QUERY_VALUE_SEPARATOR) : undefined);
  };

  const handleRemoveOfficeHours = () => {
    setParam('hasOfficeHours', undefined);
  };

  const handleRemoveFriends = () => {
    setParam('includeFriends', undefined);
  };

  const handleRemoveSearch = () => {
    setParam('q', undefined);
  };

  const getSortLabel = (sortValue: string) => {
    switch (sortValue) {
      case SORT_OPTIONS.ASCENDING:
        return 'A-Z';
      case SORT_OPTIONS.DESCENDING:
        return 'Z-A';
      default:
        return 'Sort';
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedDown: () => setIsFilterDrawerOpen(false),
  });

  return (
    <>
      <div className={s.root}>
        <div className={s.header}>
          <button className={s.filtersButton} onClick={handleFilterClick}>
            <PlusIcon /> Filters
            {filterCount > 0 && <span>&nbsp;({filterCount})</span>}
          </button>
          <div className={s.rightSection}>
            {/* Sort Menu using base-ui */}
            <Menu.Root modal={false}>
              <Menu.Trigger className={s.filtersButton}>
                Sort <ChevronDown />
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

        {/* Applied Filter Badges */}
        {(appliedTopics.length > 0 ||
          appliedRoles.length > 0 ||
          appliedSearchRoles.length > 0 ||
          hasOfficeHours ||
          includeFriends ||
          search) && (
          <div className={s.filterBadges}>
            {appliedTopics.map((topic) => (
              <div key={`topic-${topic}`} className={s.filterBadge}>
                <span className={s.badgeLabel}>OH: {topic}</span>
                <button
                  className={s.badgeRemove}
                  onClick={() => handleRemoveTopicBadge(topic)}
                  aria-label={`Remove ${topic} topic filter`}
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
            {appliedRoles.map((role) => (
              <div key={`role-${role}`} className={s.filterBadge}>
                <span className={s.badgeLabel}>Role: {role}</span>
                <button
                  className={s.badgeRemove}
                  onClick={() => handleRemoveRoleBadge(role)}
                  aria-label={`Remove ${role} role filter`}
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
            {appliedSearchRoles.map((role) => (
              <div key={`search-role-${role}`} className={s.filterBadge}>
                <span className={s.badgeLabel}>Search: {role}</span>
                <button
                  className={s.badgeRemove}
                  onClick={() => handleRemoveSearchRoleBadge(role)}
                  aria-label={`Remove ${role} search filter`}
                >
                  <CloseIcon />
                </button>
              </div>
            ))}
            {hasOfficeHours && (
              <div className={s.filterBadge}>
                <span className={s.badgeLabel}>Office Hours Only</span>
                <button
                  className={s.badgeRemove}
                  onClick={handleRemoveOfficeHours}
                  aria-label="Remove office hours filter"
                >
                  <CloseIcon />
                </button>
              </div>
            )}
            {includeFriends && (
              <div className={s.filterBadge}>
                <span className={s.badgeLabel}>Include Friends</span>
                <button
                  className={s.badgeRemove}
                  onClick={handleRemoveFriends}
                  aria-label="Remove include friends filter"
                >
                  <CloseIcon />
                </button>
              </div>
            )}
            {search && (
              <div className={s.filterBadge}>
                <span className={s.badgeLabel}>Search Query</span>
                <button className={s.badgeRemove} onClick={handleRemoveSearch} aria-label="Remove search query filter">
                  <CloseIcon />
                </button>
              </div>
            )}
          </div>
        )}
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

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 1.5C6.71442 1.5 5.45772 1.88122 4.3888 2.59545C3.31988 3.30968 2.48676 4.32484 1.99479 5.51256C1.50282 6.70028 1.37409 8.00721 1.6249 9.26809C1.8757 10.529 2.49477 11.6872 3.40381 12.5962C4.31285 13.5052 5.47104 14.1243 6.73192 14.3751C7.99279 14.6259 9.29973 14.4972 10.4874 14.0052C11.6752 13.5132 12.6903 12.6801 13.4046 11.6112C14.1188 10.5423 14.5 9.28558 14.5 8C14.4982 6.27665 13.8128 4.62441 12.5942 3.40582C11.3756 2.18722 9.72335 1.50182 8 1.5ZM8 13.5C6.91221 13.5 5.84884 13.1774 4.94437 12.5731C4.0399 11.9687 3.33495 11.1098 2.91867 10.1048C2.50238 9.09977 2.39347 7.9939 2.60568 6.927C2.8179 5.86011 3.34173 4.8801 4.11092 4.11091C4.8801 3.34172 5.86011 2.8179 6.92701 2.60568C7.9939 2.39346 9.09977 2.50238 10.1048 2.91866C11.1098 3.33494 11.9687 4.03989 12.5731 4.94436C13.1774 5.84883 13.5 6.9122 13.5 8C13.4983 9.45818 12.9184 10.8562 11.8873 11.8873C10.8562 12.9184 9.45819 13.4983 8 13.5ZM11 8C11 8.13261 10.9473 8.25979 10.8536 8.35355C10.7598 8.44732 10.6326 8.5 10.5 8.5H8.5V10.5C8.5 10.6326 8.44732 10.7598 8.35356 10.8536C8.25979 10.9473 8.13261 11 8 11C7.86739 11 7.74022 10.9473 7.64645 10.8536C7.55268 10.7598 7.5 10.6326 7.5 10.5V8.5H5.5C5.36739 8.5 5.24022 8.44732 5.14645 8.35355C5.05268 8.25979 5 8.13261 5 8C5 7.86739 5.05268 7.74021 5.14645 7.64645C5.24022 7.55268 5.36739 7.5 5.5 7.5H7.5V5.5C7.5 5.36739 7.55268 5.24021 7.64645 5.14645C7.74022 5.05268 7.86739 5 8 5C8.13261 5 8.25979 5.05268 8.35356 5.14645C8.44732 5.24021 8.5 5.36739 8.5 5.5V7.5H10.5C10.6326 7.5 10.7598 7.55268 10.8536 7.64645C10.9473 7.74021 11 7.86739 11 8Z"
      fill="#455468"
    />
  </svg>
);

const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.354 6.35403L8.35403 11.354C8.30759 11.4005 8.25245 11.4374 8.19175 11.4626C8.13105 11.4877 8.06599 11.5007 8.00028 11.5007C7.93457 11.5007 7.86951 11.4877 7.80881 11.4626C7.74811 11.4374 7.69296 11.4005 7.64653 11.354L2.64653 6.35403C2.55271 6.26021 2.5 6.13296 2.5 6.00028C2.5 5.8676 2.55271 5.74035 2.64653 5.64653C2.74035 5.55271 2.8676 5.5 3.00028 5.5C3.13296 5.5 3.26021 5.55271 3.35403 5.64653L8.00028 10.2934L12.6465 5.64653C12.693 5.60007 12.7481 5.56322 12.8088 5.53808C12.8695 5.51294 12.9346 5.5 13.0003 5.5C13.066 5.5 13.131 5.51294 13.1917 5.53808C13.2524 5.56322 13.3076 5.60007 13.354 5.64653C13.4005 5.69298 13.4373 5.74813 13.4625 5.80883C13.4876 5.86953 13.5006 5.93458 13.5006 6.00028C13.5006 6.06598 13.4876 6.13103 13.4625 6.19173C13.4373 6.25242 13.4005 6.30757 13.354 6.35403Z"
      fill="#455468"
    />
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.5 2.5H3.5C3.23478 2.5 2.98043 2.60536 2.79289 2.79289C2.60536 2.98043 2.5 3.23478 2.5 3.5V6.5C2.5 6.76522 2.60536 7.01957 2.79289 7.20711C2.98043 7.39464 3.23478 7.5 3.5 7.5H6.5C6.76522 7.5 7.01957 7.39464 7.20711 7.20711C7.39464 7.01957 7.5 6.76522 7.5 6.5V3.5C7.5 3.23478 7.39464 2.98043 7.20711 2.79289C7.01957 2.60536 6.76522 2.5 6.5 2.5ZM6.5 6.5H3.5V3.5H6.5V6.5ZM12.5 2.5H9.5C9.23478 2.5 8.98043 2.60536 8.79289 2.79289C8.60536 2.98043 8.5 3.23478 8.5 3.5V6.5C8.5 6.76522 8.60536 7.01957 8.79289 7.20711C8.98043 7.39464 9.23478 7.5 9.5 7.5H12.5C12.7652 7.5 13.0196 7.39464 13.2071 7.20711C13.3946 7.01957 13.5 6.76522 13.5 6.5V3.5C13.5 3.23478 13.3946 2.98043 13.2071 2.79289C13.0196 2.60536 12.7652 2.5 12.5 2.5ZM12.5 6.5H9.5V3.5H12.5V6.5ZM6.5 8.5H3.5C3.23478 8.5 2.98043 8.60536 2.79289 8.79289C2.60536 8.98043 2.5 9.23478 2.5 9.5V12.5C2.5 12.7652 2.60536 13.0196 2.79289 13.2071C2.98043 13.3946 3.23478 13.5 3.5 13.5H6.5C6.76522 13.5 7.01957 13.3946 7.20711 13.2071C7.39464 13.0196 7.5 12.7652 7.5 12.5V9.5C7.5 9.23478 7.39464 8.98043 7.20711 8.79289C7.01957 8.60536 6.76522 8.5 6.5 8.5ZM6.5 12.5H3.5V9.5H6.5V12.5ZM12.5 8.5H9.5C9.23478 8.5 8.98043 8.60536 8.79289 8.79289C8.60536 8.98043 8.5 9.23478 8.5 9.5V12.5C8.5 12.7652 8.60536 13.0196 8.79289 13.2071C8.98043 13.3946 9.23478 13.5 9.5 13.5H12.5C12.7652 13.5 13.0196 13.3946 13.2071 13.2071C13.3946 13.0196 13.5 12.7652 13.5 12.5V9.5C13.5 9.23478 13.3946 8.98043 13.2071 8.79289C13.0196 8.60536 12.7652 8.5 12.5 8.5ZM12.5 12.5H9.5V9.5H12.5V12.5Z"
      fill="currentColor"
    />
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14 8C14 8.13261 13.9473 8.25979 13.8536 8.35355C13.7598 8.44732 13.6326 8.5 13.5 8.5H2.5C2.36739 8.5 2.24021 8.44732 2.14645 8.35355C2.05268 8.25979 2 8.13261 2 8C2 7.86739 2.05268 7.74021 2.14645 7.64645C2.24021 7.55268 2.36739 7.5 2.5 7.5H13.5C13.6326 7.5 13.7598 7.55268 13.8536 7.64645C13.9473 7.74021 14 7.86739 14 8ZM2.5 4.5H13.5C13.6326 4.5 13.7598 4.44732 13.8536 4.35355C13.9473 4.25979 14 4.13261 14 4C14 3.86739 13.9473 3.74021 13.8536 3.64645C13.7598 3.55268 13.6326 3.5 13.5 3.5H2.5C2.36739 3.5 2.24021 3.55268 2.14645 3.64645C2.05268 3.74021 2 3.86739 2 4C2 4.13261 2.05268 4.25979 2.14645 4.35355C2.24021 4.44732 2.36739 4.5 2.5 4.5ZM13.5 11.5H2.5C2.36739 11.5 2.24021 11.5527 2.14645 11.6464C2.05268 11.7402 2 11.8674 2 12C2 12.1326 2.05268 12.2598 2.14645 12.3536C2.24021 12.4473 2.36739 12.5 2.5 12.5H13.5C13.6326 12.5 13.7598 12.4473 13.8536 12.3536C13.9473 12.2598 14 12.1326 14 12C14 11.8674 13.9473 11.7402 13.8536 11.6464C13.7598 11.5527 13.6326 11.5 13.5 11.5Z"
      fill="currentColor"
    />
  </svg>
);
