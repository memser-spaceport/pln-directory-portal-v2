'use client';

import { useCallback } from 'react';
import { IDealFilterValues } from '@/types/deals.types';
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
    [selectedCategories, onCategoriesChange]
  );

  const toggleAudience = useCallback(
    (value: string) => {
      if (selectedAudiences.includes(value)) {
        onAudiencesChange(selectedAudiences.filter((a) => a !== value));
      } else {
        onAudiencesChange([...selectedAudiences, value]);
      }
    },
    [selectedAudiences, onAudiencesChange]
  );

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || selectedAudiences.length > 0;

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.headerTitle}>Filters</h2>
        {hasActiveFilters && (
          <button className={s.clearAll} onClick={onClearAll}>
            Clear All
          </button>
        )}
      </div>

      <div className={s.divider} />

      {/* Deal Search */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h3 className={s.sectionTitle}>Deal Search</h3>
        </div>
        <div className={s.sectionContent}>
          <input
            type="text"
            className={s.searchInput}
            placeholder="Search for a deal"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
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
    </div>
  );
}
