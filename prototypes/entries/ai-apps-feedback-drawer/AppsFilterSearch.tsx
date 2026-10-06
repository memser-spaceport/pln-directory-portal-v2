'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import clsx from 'clsx';

import { CloseIcon, SearchIcon } from '@/components/icons';
// Production stylesheet imported verbatim, so the prototype's search field
// tracks the members rail's if that ever changes.
import styles from '@/components/page/members/MembersFilter/FilterSearch/FilterSearch.module.scss';

import { useMockAiAppsFilterStore } from './mockAiAppsFilterStore';
// One `min-width: 0` on the input, so the magnifier stops sitting on the border.
// The whole reason is written out in the stylesheet.
import local from './AppsFilterSearch.module.scss';

interface Props {
  label?: string;
  placeholder: string;
  debounceMs?: number;
}

/**
 * COPY-SIMPLIFY of production `FilterSearch` (components/page/members/
 * MembersFilter/FilterSearch). Same markup, same stylesheet; the change that
 * forced the transcription is the store — production hard-wires `useFilterStore`
 * (the members Zustand store) with no way to pass another, so a prototype on mock
 * data has to transcribe rather than import. Analytics dropped.
 *
 * **One declared deviation, and it is a bug fix.** The transcribed flex row
 * leaves the magnifier pressed against the field's right border (-1px of
 * clearance where its own padding asks for 12), because the input's default
 * `min-width: auto` won't let it shrink. `AppsFilterSearch.module.scss` adds the
 * `min-width: 0` that releases it — the same declaration the design system's own
 * `SearchInput` carries, which is why the other search field in this rail measures
 * correctly. The full mechanism is written out there. Production has the same
 * defect and is not ours to edit.
 *
 * It lives in the rail, not the toolbar, because that is where Members puts it
 * (a title-less FilterSection at the head of the panel) and Deals after it.
 */
export function AppsFilterSearch({ label, placeholder, debounceMs = 300 }: Props) {
  const { params, setParam } = useMockAiAppsFilterStore();
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useDebounce(() => setDebouncedValue(inputValue), debounceMs, [inputValue]);

  // Mirror the param back into the field, so "Clear All" empties the input too.
  const searchParam = params.get('search');
  useEffect(() => {
    if (searchParam !== null) {
      setInputValue(searchParam);
      setDebouncedValue(searchParam);
    } else if (isInitialized) {
      setInputValue('');
      setDebouncedValue('');
    }
    if (!isInitialized) setIsInitialized(true);
  }, [searchParam, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    const trimmed = debouncedValue.trim();
    setParam('search', trimmed === '' ? undefined : trimmed);
  }, [debouncedValue, setParam, isInitialized]);

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
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className={clsx(styles.input, local.input)}
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
