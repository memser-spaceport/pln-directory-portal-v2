'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/services/members/store';
import { useDebounce } from 'react-use';
import styles from './FilterRange.module.scss';

interface Props {
  label: string;
  minParamName: string;
  maxParamName: string;
  allowedRange: {
    min: number;
    max: number;
  };
  formatValue?: (value: number) => string;
  parseValue?: (value: string) => number;
  placeholder?: {
    min?: string;
    max?: string;
  };
  debounceMs?: number;
}

export function FilterRange({
  label,
  minParamName,
  maxParamName,
  allowedRange,
  formatValue = (value) => value.toString(),
  parseValue = (value) => parseFloat(value.replace(/[^\d.]/g, '')) || 0,
  placeholder = { min: 'Min', max: 'Max' },
  debounceMs = 700,
}: Props) {
  const { params, setParam } = useFilterStore();

  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [debouncedMinValue, setDebouncedMinValue] = useState('');
  const [debouncedMaxValue, setDebouncedMaxValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Debounce the input values
  useDebounce(
    () => {
      setDebouncedMinValue(minValue);
    },
    debounceMs,
    [minValue],
  );

  useDebounce(
    () => {
      setDebouncedMaxValue(maxValue);
    },
    debounceMs,
    [maxValue],
  );

  // Track the current parameter values to detect changes
  const currentMinParam = params.get(minParamName) || '';
  const currentMaxParam = params.get(maxParamName) || '';

  // Get initial values from URL parameters
  useEffect(() => {
    if (currentMinParam !== '') {
      const numericMin = parseFloat(currentMinParam);
      const formattedMin = formatValue(numericMin);
      setMinValue(formattedMin);
      setDebouncedMinValue(formattedMin);
    } else if (isInitialized) {
      setMinValue('');
      setDebouncedMinValue('');
    }

    if (currentMaxParam !== '') {
      const numericMax = parseFloat(currentMaxParam);
      const formattedMax = formatValue(numericMax);
      setMaxValue(formattedMax);
      setDebouncedMaxValue(formattedMax);
    } else if (isInitialized) {
      setMaxValue('');
      setDebouncedMaxValue('');
    }

    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [currentMinParam, currentMaxParam, isInitialized]);

  // Update URL parameters when debounced values change
  useEffect(() => {
    if (!isInitialized) return;

    const trimmedMinValue = debouncedMinValue.trim();
    const trimmedMaxValue = debouncedMaxValue.trim();

    // Update min parameter
    if (trimmedMinValue === '') {
      setParam(minParamName, undefined);
    } else {
      const numericMin = parseValue(trimmedMinValue);
      if (!isNaN(numericMin) && numericMin >= allowedRange.min && numericMin <= allowedRange.max) {
        setParam(minParamName, numericMin.toString());
      }
    }

    // Update max parameter
    if (trimmedMaxValue === '') {
      setParam(maxParamName, undefined);
    } else {
      const numericMax = parseValue(trimmedMaxValue);
      if (!isNaN(numericMax) && numericMax >= allowedRange.min && numericMax <= allowedRange.max) {
        setParam(maxParamName, numericMax.toString());
      }
    }
  }, [debouncedMinValue, debouncedMaxValue, setParam, isInitialized, minParamName, maxParamName, allowedRange.min, allowedRange.max]);

  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMinValue(e.target.value);
  }, []);

  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setMinValue('');
    setMaxValue('');
    setDebouncedMinValue('');
    setDebouncedMaxValue('');
    setParam(minParamName, undefined);
    setParam(maxParamName, undefined);
  }, [setParam, minParamName, maxParamName]);

  const hasValue = minValue.trim().length > 0 || maxValue.trim().length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.inputLabel}>{label}</div>
        {hasValue && (
          <button type="button" onClick={handleClear} className={styles.clearButton}>
            Clear all
          </button>
        )}
      </div>

      <div className={styles.rangeContainer}>
        <div className={styles.inputWrapper}>
          <div className={styles.inputContainer}>
            <input type="text" value={minValue} onChange={handleMinChange} placeholder={placeholder.min} className={styles.input} />
          </div>
        </div>

        <div className={styles.inputWrapper}>
          <div className={styles.inputContainer}>
            <input type="text" value={maxValue} onChange={handleMaxChange} placeholder={placeholder.max} className={styles.input} />
          </div>
        </div>
      </div>

      <div className={styles.rangeInfo}>
        Range: {formatValue(allowedRange.min)} - {formatValue(allowedRange.max)}
      </div>
    </div>
  );
}
