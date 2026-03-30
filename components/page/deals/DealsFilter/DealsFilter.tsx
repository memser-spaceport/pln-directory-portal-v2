'use client';

import { useCallback } from 'react';
import { IDealFilterValues } from '@/types/deals.types';
import { CloseIcon, SearchIcon } from '@/components/icons';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import s from './DealsFilter.module.scss';

interface DealsFilterProps {
  filterValues: IDealFilterValues;
  searchQuery: string;
  selectedCategories: string[];
  selectedAudiences: string[];
  onSearchChange: (value: string) => void;
  onCategoriesChange: (categories: string[]) => void;
  onAudiencesChange: (audiences: string[]) => void;
  onClearAll: () => void;
}

export function DealsFilter({
  filterValues,
  searchQuery,
  selectedCategories,
  selectedAudiences,
  onSearchChange,
  onCategoriesChange,
  onAudiencesChange,
  onClearAll,
}: DealsFilterProps) {
  const toggleCategory = useCallback(
    (value: string) => {
      if (selectedCategories.includes(value)) {
        onCategoriesChange(selectedCategories.filter((c) => c !== value));
      } else {
        onCategoriesChange([...selectedCategories, value]);
      }
    },
    [selectedCategories, onCategoriesChange],
  );

  const toggleAudience = useCallback(
    (value: string) => {
      if (selectedAudiences.includes(value)) {
        onAudiencesChange(selectedAudiences.filter((a) => a !== value));
      } else {
        onAudiencesChange([...selectedAudiences, value]);
      }
    },
    [selectedAudiences, onAudiencesChange],
  );

  const appliedFiltersCount = selectedCategories.length + selectedAudiences.length + (searchQuery ? 1 : 0);

  return (
    <FiltersSidePanel
      clearParams={onClearAll}
      appliedFiltersCount={appliedFiltersCount}
      className={s.root}
      hideFooter
    >
      {/* Deal Search */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h3 className={s.sectionTitle}>Deal Search</h3>
        </div>
        <div className={s.sectionContent}>
          <div className={s.searchInputContainer}>
            <input
              type="text"
              className={s.searchInput}
              placeholder="Search for a deal"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {!searchQuery && (
              <div className={s.searchIcon}>
                <SearchIcon />
              </div>
            )}
            {searchQuery && (
              <button
                type="button"
                className={s.clearButton}
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      {filterValues.categories.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionHeader}>
            <h3 className={s.sectionTitle}>Categories</h3>
          </div>
          <div className={s.sectionContent}>
            <div className={s.checkboxList}>
              {filterValues.categories.map((option) => (
                <label key={option.value} className={s.checkboxItem}>
                  <input
                    type="checkbox"
                    className={s.checkbox}
                    checked={selectedCategories.includes(option.value)}
                    onChange={() => toggleCategory(option.value)}
                  />
                  <span className={s.checkboxLabel}>{option.label}</span>
                  {option.count > 0 && <span className={s.checkboxCount}>{option.count}</span>}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audience */}
      {filterValues.audiences.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionHeader}>
            <h3 className={s.sectionTitle}>Audience</h3>
          </div>
          <div className={s.sectionContent}>
            <div className={s.checkboxList}>
              {filterValues.audiences.map((option) => (
                <label key={option.value} className={s.checkboxItem}>
                  <input
                    type="checkbox"
                    className={s.checkbox}
                    checked={selectedAudiences.includes(option.value)}
                    onChange={() => toggleAudience(option.value)}
                  />
                  <span className={s.checkboxLabel}>{option.label}</span>
                  {option.count > 0 && <span className={s.checkboxCount}>{option.count}</span>}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </FiltersSidePanel>
  );
}
