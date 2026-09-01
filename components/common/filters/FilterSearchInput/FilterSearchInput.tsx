'use client';

import React, { useEffect, useState } from 'react';
import { useDebounce } from 'react-use';

import type { FilterStoreHook } from '@/services/filters/types';

import { CloseIcon, SearchIcon } from '@/components/icons';

import styles from './FilterSearchInput.module.scss';

interface Props {
  /** Any store made by `createFilterStore` — this is what makes the field reusable. */
  filterStore: FilterStoreHook;
  label?: string;
  placeholder: string;
  /** Param this field writes. Defaults to the `search` key every rail uses today. */
  paramKey?: string;
  debounceMs?: number;
}

/**
 * The free-text field that heads a filters rail. Generalised from the members
 * rail's own field, which hard-wired that page's store; the store is now a prop.
 */
export function FilterSearchInput(props: Props) {
  const { filterStore, label, placeholder, paramKey = 'search', debounceMs = 700 } = props;

  const { params, setParam } = filterStore();
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useDebounce(() => setDebouncedValue(inputValue), debounceMs, [inputValue]);

  const searchParam = params.get(paramKey);
  // Mirrors the param back into the field: "Clear All" and back/forward both
  // change it with no keystroke involved. Settles in one render and cannot
  // cascade, since it only ever assigns the param's own value.
  useEffect(() => {
    if (searchParam !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue(searchParam);
      setDebouncedValue(searchParam);
    } else if (isInitialized) {
      setInputValue('');
      setDebouncedValue('');
    }

    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [searchParam, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    const trimmed = debouncedValue.trim();
    setParam(paramKey, trimmed === '' ? undefined : trimmed);
  }, [debouncedValue, setParam, paramKey, isInitialized]);

  const handleClear = () => {
    setInputValue('');
    setDebouncedValue('');
    setParam(paramKey, undefined);
  };

  const hasValue = inputValue.trim().length > 0;

  return (
    <div className={styles.container}>
      {label && <div className={styles.inputLabel}>{label}</div>}
      <div className={styles.inputWrapper}>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className={styles.input}
          />
          {!hasValue && (
            <div className={styles.inputPrefix}>
              <SearchIcon />
            </div>
          )}
          {hasValue && (
            <button type="button" onClick={handleClear} className={styles.clearButton} aria-label="Clear search">
              <CloseIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
