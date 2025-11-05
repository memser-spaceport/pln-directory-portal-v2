'use client';

import React, { useState, useEffect } from 'react';
import styles from './FilterCheckSizeInput.module.scss';

interface Props {
  label: string;
  minParamName: string;
  maxParamName: string;
  allowedRange: {
    min: number;
    max: number;
  };
  disabled?: boolean;
  params: URLSearchParams;
  setParam: (key: string, value?: string) => void;
}

export function FilterCheckSizeInput({
  label,
  minParamName,
  maxParamName,
  allowedRange,
  disabled = false,
  params,
  setParam,
}: Props) {
  // Get current values from URL parameters
  const currentMinParam = params.get(minParamName) || '';
  const currentMaxParam = params.get(maxParamName) || '';

  // Local state for input values (as strings for display)
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');

  // Track focus state for formatting
  const [isMinFocused, setIsMinFocused] = useState(false);
  const [isMaxFocused, setIsMaxFocused] = useState(false);

  // Initialize values from URL parameters
  useEffect(() => {
    if (currentMinParam !== '') {
      const numericMin = parseFloat(currentMinParam);
      setMinValue(numericMin.toString());
    } else {
      setMinValue('');
    }

    if (currentMaxParam !== '') {
      const numericMax = parseFloat(currentMaxParam);
      setMaxValue(numericMax.toString());
    } else {
      setMaxValue('');
    }
  }, [currentMinParam, currentMaxParam]);

  // Format number as USD currency
  const formatAsCurrency = (value: string): string => {
    if (!value || value === '') return '';
    const numericValue = parseFloat(value.replace(/,/g, ''));
    if (isNaN(numericValue)) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericValue);
  };

  // Parse currency string to number
  const parseCurrency = (value: string): string => {
    if (!value) return '';
    // Remove all non-digit characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    return cleaned;
  };

  // Handle minimum value change
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cleaned = parseCurrency(rawValue);
    setMinValue(cleaned);
  };

  // Handle maximum value change
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cleaned = parseCurrency(rawValue);
    setMaxValue(cleaned);
  };

  // Apply minimum value to URL parameter
  const applyMinValue = () => {
    if (minValue === '') {
      setParam(minParamName, undefined);
      return;
    }

    const numericValue = parseFloat(minValue);
    if (isNaN(numericValue)) {
      setMinValue('');
      setParam(minParamName, undefined);
      return;
    }

    // Clamp to allowed range
    const clampedValue = Math.max(allowedRange.min, Math.min(numericValue, allowedRange.max));

    if (clampedValue === allowedRange.min) {
      setParam(minParamName, undefined);
      setMinValue('');
    } else {
      setParam(minParamName, clampedValue.toString());
      setMinValue(clampedValue.toString());

      // If maximum is set and is less than the new minimum, clear maximum
      if (maxValue !== '') {
        const currentMax = parseFloat(maxValue);
        if (!isNaN(currentMax) && currentMax < clampedValue) {
          setMaxValue('');
          setParam(maxParamName, undefined);
        }
      }
    }
  };

  // Apply maximum value to URL parameter
  const applyMaxValue = () => {
    if (maxValue === '') {
      setParam(maxParamName, undefined);
      return;
    }

    const numericValue = parseFloat(maxValue);
    if (isNaN(numericValue)) {
      setMaxValue('');
      setParam(maxParamName, undefined);
      return;
    }

    // Clamp to allowed range
    const clampedValue = Math.max(allowedRange.min, Math.min(numericValue, allowedRange.max));

    // Check if minimum is set and maximum is less than minimum
    if (minValue !== '') {
      const currentMin = parseFloat(minValue);
      if (!isNaN(currentMin) && clampedValue < currentMin) {
        // Clear maximum if it's less than minimum
        setMaxValue('');
        setParam(maxParamName, undefined);
        return;
      }
    }

    if (clampedValue === allowedRange.max) {
      setParam(maxParamName, undefined);
      setMaxValue('');
    } else {
      setParam(maxParamName, clampedValue.toString());
      setMaxValue(clampedValue.toString());
    }
  };

  // Handle minimum blur - update URL parameter
  const handleMinBlur = () => {
    setIsMinFocused(false);
    applyMinValue();
  };

  // Handle maximum blur - update URL parameter
  const handleMaxBlur = () => {
    setIsMaxFocused(false);
    applyMaxValue();
  };

  // Handle key press for minimum input
  const handleMinKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyMinValue();
      e.currentTarget.blur();
    }
  };

  // Handle key press for maximum input
  const handleMaxKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyMaxValue();
      e.currentTarget.blur();
    }
  };

  // Get display value for input
  const getDisplayValue = (value: string, isFocused: boolean): string => {
    if (isFocused || value === '') {
      return value;
    }
    return formatAsCurrency(value);
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>

      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Minimum</label>
        <input
          type="text"
          className={styles.input}
          placeholder="E.g. $1000"
          value={getDisplayValue(minValue, isMinFocused)}
          onChange={handleMinChange}
          onFocus={() => setIsMinFocused(true)}
          onBlur={handleMinBlur}
          onKeyPress={handleMinKeyPress}
          disabled={disabled}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Maximum</label>
        <input
          type="text"
          className={styles.input}
          placeholder="E.g. $500,000"
          value={getDisplayValue(maxValue, isMaxFocused)}
          onChange={handleMaxChange}
          onFocus={() => setIsMaxFocused(true)}
          onBlur={handleMaxBlur}
          onKeyPress={handleMaxKeyPress}
          disabled={disabled}
        />
      </div>
    </div>
  );
}