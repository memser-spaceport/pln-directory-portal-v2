'use client';

import { useDebounce } from 'react-use';
import React, { useState, useEffect, useCallback } from 'react';

import { useFilterStore } from '@/services/members/store';
import { CloseIcon, SearchIcon } from '@/components/icons';

import styles from './FilterSearch.module.scss';

interface Props {
  label?: string;
  placeholder: string;
  debounceMs?: number;
}

export function FilterSearch({ label, placeholder, debounceMs = 700 }: Props) {
  const { params, setParam } = useFilterStore();
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Debounce the input value to avoid too many API calls
  useDebounce(
    () => {
      setDebouncedValue(inputValue);
    },
    debounceMs,
    [inputValue],
  );

  // Get initial value from URL parameters and handle clear all
  useEffect(() => {
    const paramValue = params.get('search');
    if (paramValue !== null) {
      setInputValue(paramValue);
      setDebouncedValue(paramValue);
    } else if (isInitialized) {
      // Only clear the input if we've been initialized and the parameter is removed
      setInputValue('');
      setDebouncedValue('');
    }

    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [params.get('search'), isInitialized]);

  // Update URL parameters when debounced value changes (but not during initialization)
  useEffect(() => {
    if (!isInitialized) return;

    const trimmedValue = debouncedValue.trim();

    // Always update the parameter to match the current debounced value
    if (trimmedValue === '') {
      setParam('search', undefined);
    } else {
      setParam('search', trimmedValue);
    }
  }, [debouncedValue, setParam, isInitialized]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);
  const handleClear = useCallback(() => {
    setInputValue('');
    setDebouncedValue('');
    setParam('search', undefined);
  }, [setParam]);

  const hasValue = inputValue.trim().length > 0;

  return (
    <div className={styles.container}>
      {label && <div className={styles.inputLabel}>{label}</div>}
      <div className={styles.inputWrapper}>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
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
