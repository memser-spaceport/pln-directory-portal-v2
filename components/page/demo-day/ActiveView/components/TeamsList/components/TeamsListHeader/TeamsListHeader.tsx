import React from 'react';
import { clsx } from 'clsx';
import { Menu } from '@base-ui-components/react/menu';
import { GroupWithCount } from '../../hooks/useTeamsSorting';
import s from './TeamsListHeader.module.scss';

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SortIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 4H13M5 8H11M7 12H9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2 4H14M4 8H12M6 12H10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export type SortOption = {
  value: string;
  label: string;
};

export const SORT_OPTIONS: SortOption[] = [
  { value: 'stage-asc', label: 'Pre-seed > Seed > Series A/B > Fund' },
  { value: 'stage-desc', label: 'Fund > Series A/B > Seed > Pre-seed' },
];

interface TeamsListHeaderProps {
  allGroupsWithCounts: GroupWithCount[];
  activeGroup: string;
  sortBy: string;
  onGroupClick: (stageGroup: string) => void;
  onSortChange: (value: string) => void;
  onFiltersClick: () => void;
}

export const TeamsListHeader: React.FC<TeamsListHeaderProps> = ({
  allGroupsWithCounts,
  activeGroup,
  sortBy,
  onGroupClick,
  onSortChange,
  onFiltersClick,
}) => {
  const selectedSortOption = SORT_OPTIONS.find((option) => option.value === sortBy);

  return (
    <div className={s.header}>
      <div className={s.headerLeft}>
        {allGroupsWithCounts.map((group) => (
          <button
            key={group.stageGroup}
            className={clsx(s.groupBadge, {
              [s.active]: activeGroup === group.stageGroup,
            })}
            onClick={() => onGroupClick(group.stageGroup)}
          >
            <span className={s.groupLabel}>{group.label}</span>
            <span className={s.groupCount}>{group.count}</span>
          </button>
        ))}
      </div>

      <div className={s.filtersWrapper}>
        <button className={s.filterButton} onClick={onFiltersClick}>
          <FilterIcon />
          <span>Filters</span>
        </button>
        <div className={s.headerRight}>
          <Menu.Root modal={false}>
            <Menu.Trigger className={s.sortButton}>
              <SortIcon />
              <span className={s.sortLabel}>Sort by: {selectedSortOption?.label}</span>
              <ChevronDownIcon />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner className={s.menuPositioner} align="end" sideOffset={8}>
                <Menu.Popup className={s.menuPopup}>
                  {SORT_OPTIONS.map((option) => (
                    <Menu.Item
                      key={option.value}
                      className={clsx(s.menuItem, {
                        [s.active]: sortBy === option.value,
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
  );
};

