import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useFilterStore } from '@/services/members/store';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import s from './FilterList.module.scss';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useReportAnalyticsEvent, TrackEventDto } from '@/services/demo-day/hooks/useReportAnalyticsEvent';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { IUserInfo } from '@/types/shared.types';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

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

export interface FilterOption {
  id: string;
  name: string;
  count: number;
}

interface FilterListProps {
  options: FilterOption[];
  paramName: string;
  placeholder?: string;
  emptyMessage?: string;
  initialDisplayCount?: number;
}

export const FilterList: React.FC<FilterListProps> = ({
  options,
  paramName,
  placeholder = 'Search options...',
  emptyMessage = 'No options found',
  initialDisplayCount = 5,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const { params, setParam } = useFilterStore();

  // Analytics hooks
  const { onActiveViewFiltersApplied } = useDemoDayAnalytics();
  const reportAnalytics = useReportAnalyticsEvent();
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  // Get selected options from URL parameters
  const selectedOptions = useMemo(() => {
    const paramValue = params.get(paramName);
    if (!paramValue) return [];
    return paramValue.split(URL_QUERY_VALUE_SEPARATOR);
  }, [params, paramName]);

  // Update URL parameters when selection changes
  const updateSelection = useCallback((newSelection: string[], changedOption?: { id: string; name: string; action: 'added' | 'removed' }) => {
    if (newSelection.length > 0) {
      const values = newSelection.join(URL_QUERY_VALUE_SEPARATOR);
      setParam(paramName, values);
    } else {
      setParam(paramName, undefined);
    }

    // Report filter analytics
    if (userInfo?.email && changedOption) {
      // PostHog analytics
      onActiveViewFiltersApplied({
        filterType: paramName,
        filterValue: changedOption.name,
        action: changedOption.action,
        totalSelected: newSelection.length,
      });

      // Custom analytics event
      const filterEvent: TrackEventDto = {
        name: 'active_view_filters_applied',
        distinctId: userInfo.email,
        properties: {
          userId: userInfo.uid,
          userEmail: userInfo.email,
          userName: userInfo.name,
          path: '/demoday',
          timestamp: new Date().toISOString(),
          filterType: paramName,
          filterValue: changedOption.name,
          filterId: changedOption.id,
          action: changedOption.action,
          totalSelected: newSelection.length,
          selectedFilters: newSelection,
        },
      };

      reportAnalytics.mutate(filterEvent);
    }
  }, [paramName, setParam, userInfo, onActiveViewFiltersApplied, reportAnalytics]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) {
      return options;
    }

    const searchLower = searchTerm.toLowerCase();
    return options.filter((option) => option.name.toLowerCase().includes(searchLower));
  }, [options, searchTerm]);

  // Determine which options to display based on showAll state and search
  const displayedOptions = useMemo(() => {
    if (searchTerm.trim()) {
      // When searching, always show all results
      return filteredOptions;
    }

    if (showAll || filteredOptions.length <= initialDisplayCount) {
      return filteredOptions;
    }

    return filteredOptions.slice(0, initialDisplayCount);
  }, [filteredOptions, showAll, searchTerm, initialDisplayCount]);

  const hasMoreOptions = filteredOptions.length > initialDisplayCount;
  const isSearching = searchTerm.trim().length > 0;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClearSearch();
    }
  }, []);

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowAll(false); // Reset to collapsed state when clearing search
  };

  const handleToggleShowAll = () => {
    setShowAll(!showAll);
  };

  const handleOptionToggle = (optionId: string) => {
    const isSelected = selectedOptions.includes(optionId);
    const option = options.find(opt => opt.id === optionId);
    let newSelection: string[];
    let action: 'added' | 'removed';

    if (isSelected) {
      newSelection = selectedOptions.filter((id) => id !== optionId);
      action = 'removed';
    } else {
      newSelection = [...selectedOptions, optionId];
      action = 'added';
    }

    const changedOption = option ? {
      id: optionId,
      name: option.name,
      action,
    } : undefined;

    updateSelection(newSelection, changedOption);
  };

  const hasSearchValue = searchTerm.trim().length > 0;

  return (
    <div className={s.container}>
      {/* Search Input */}
      <div className={s.searchContainer}>
        <div className={s.inputContainer}>
          {!hasSearchValue && (
            <div className={s.inputPrefix}>
              <SearchIcon />
            </div>
          )}
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={s.input}
          />
          {hasSearchValue && (
            <button type="button" onClick={handleClearSearch} className={s.clearButton} aria-label="Clear search">
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* Options List */}
      <div className={s.optionsList}>
        {filteredOptions.length === 0 ? (
          <div className={s.emptyState}>{hasSearchValue ? `No results for "${searchTerm}"` : emptyMessage}</div>
        ) : (
          <>
            {displayedOptions.map((option) => {
              const isSelected = selectedOptions.includes(option.id);

              return (
                <label key={option.id} className={s.optionItem}>
                  <div className={s.optionContent}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleOptionToggle(option.id)}
                      className={s.checkbox}
                    />
                    <div className={s.checkboxCustom}>
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M10 3L4.5 8.5L2 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className={s.optionName}>{option.name}</span>
                    <span className={s.optionCount}>({option.count})</span>
                  </div>
                </label>
              );
            })}

            {/* Show All / Show Less Button */}
            {hasMoreOptions && !isSearching && (
              <button
                type="button"
                onClick={handleToggleShowAll}
                className={s.toggleButton}
              >
                {showAll ? 'Show less' : `Show all (${filteredOptions.length})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
