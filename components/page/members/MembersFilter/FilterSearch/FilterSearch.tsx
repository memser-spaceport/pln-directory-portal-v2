'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/services/members/store';
import { useDebounce } from 'react-use';
import styles from './FilterSearch.module.scss';

interface Props {
  label: string;
  placeholder: string;
  debounceMs?: number;
}

export function FilterSearch({ label, placeholder, debounceMs = 300 }: Props) {
  const { params, setParam } = useFilterStore();
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

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
    } else {
      // Clear the input when the parameter is removed (e.g., by "Clear all" button)
      setInputValue('');
      setDebouncedValue('');
    }
  }, [params.get('search')]);

  // Update URL parameters when debounced value changes
  useEffect(() => {
    if (debouncedValue.trim() === '') {
      setParam('search', undefined);
    } else {
      setParam('search', debouncedValue.trim());
    }
  }, [debouncedValue, setParam]);

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
      <div className={styles.inputLabel}>{label}</div>
      <div className={styles.inputWrapper}>
        <div className={styles.inputContainer}>
          {/*{!hasValue && (*/}
          {/*  <div className={styles.inputPrefix}>*/}
          {/*    <SearchIcon />*/}
          {/*  </div>*/}
          {/*)}*/}
          <input type="text" value={inputValue} onChange={handleInputChange} placeholder={placeholder} className={styles.input} />
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

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
      stroke="#64748B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M14 14L11.1 11.1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L4 12M4 4L12 12" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
