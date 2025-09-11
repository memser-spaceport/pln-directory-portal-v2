'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFilterStore } from '@/services/members/store';
import { useDebounce } from 'react-use';
import styles from './FilterRange.module.scss';
import { Slider } from '@base-ui-components/react';

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
  debounceMs?: number;
}

export function FilterRange({
  label,
  minParamName,
  maxParamName,
  allowedRange,
  formatValue = (value) => value.toString(),
  parseValue = (value) => parseFloat(value.replace(/[^\d.]/g, '')) || 0,
  debounceMs = 100,
}: Props) {
  const { params, setParam } = useFilterStore();

  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [debouncedMinValue, setDebouncedMinValue] = useState('');
  const [debouncedMaxValue, setDebouncedMaxValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Slider state - numeric values for the slider
  const [sliderValues, setSliderValues] = useState<number[]>([allowedRange.min, allowedRange.max]);
  const [isSliderUpdating, setIsSliderUpdating] = useState(false);

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
    let newSliderMin = allowedRange.min;
    let newSliderMax = allowedRange.max;

    if (currentMinParam !== '') {
      const numericMin = parseFloat(currentMinParam);
      const formattedMin = formatValue(numericMin);
      setMinValue(formattedMin);
      setDebouncedMinValue(formattedMin);
      newSliderMin = numericMin;
    } else if (isInitialized) {
      setMinValue('');
      setDebouncedMinValue('');
    }

    if (currentMaxParam !== '') {
      const numericMax = parseFloat(currentMaxParam);
      const formattedMax = formatValue(numericMax);
      setMaxValue(formattedMax);
      setDebouncedMaxValue(formattedMax);
      newSliderMax = numericMax;
    } else if (isInitialized) {
      setMaxValue('');
      setDebouncedMaxValue('');
    }

    // Update slider values
    setSliderValues([newSliderMin, newSliderMax]);

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

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isSliderUpdating) return; // Prevent circular updates

      const newValue = e.target.value;
      setMinValue(newValue);

      // Update slider position immediately if valid number
      const numericValue = parseValue(newValue);
      if (!isNaN(numericValue) && numericValue >= allowedRange.min && numericValue <= allowedRange.max) {
        setSliderValues([numericValue, sliderValues[1]]);
      }
    },
    [parseValue, allowedRange.min, allowedRange.max, sliderValues, isSliderUpdating],
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isSliderUpdating) return; // Prevent circular updates

      const newValue = e.target.value;
      setMaxValue(newValue);

      // Update slider position immediately if valid number
      const numericValue = parseValue(newValue);
      if (!isNaN(numericValue) && numericValue >= allowedRange.min && numericValue <= allowedRange.max) {
        setSliderValues([sliderValues[0], numericValue]);
      }
    },
    [parseValue, allowedRange.min, allowedRange.max, sliderValues, isSliderUpdating],
  );

  const handleSliderChange = useCallback(
    (values: number[]) => {
      const [newMin, newMax] = values;
      setIsSliderUpdating(true);
      setSliderValues(values);

      // Update input values with formatted values
      const formattedMin = newMin === allowedRange.min ? '' : formatValue(newMin);
      const formattedMax = newMax === allowedRange.max ? '' : formatValue(newMax);

      setMinValue(formattedMin);
      setMaxValue(formattedMax);
      setDebouncedMinValue(formattedMin);
      setDebouncedMaxValue(formattedMax);

      // Reset flag after state updates
      setTimeout(() => setIsSliderUpdating(false), 0);
    },
    [formatValue, allowedRange.min, allowedRange.max],
  );

  const handleClear = useCallback(() => {
    setMinValue('');
    setMaxValue('');
    setDebouncedMinValue('');
    setDebouncedMaxValue('');
    setSliderValues([allowedRange.min, allowedRange.max]);
    setParam(minParamName, undefined);
    setParam(maxParamName, undefined);
  }, [setParam, minParamName, maxParamName, allowedRange.min, allowedRange.max]);

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
            <input type="text" value={minValue} onChange={handleMinChange} placeholder={allowedRange.min.toLocaleString()} className={styles.input} />
          </div>
        </div>

        <div className={styles.inputWrapper}>
          <div className={styles.inputContainer}>
            <input type="text" value={maxValue} onChange={handleMaxChange} placeholder={allowedRange.max.toLocaleString()} className={styles.input} />
          </div>
        </div>
      </div>

      <Slider.Root className={styles.sliderContainer} value={sliderValues} onValueChange={handleSliderChange} min={allowedRange.min} max={allowedRange.max}>
        <Slider.Control className={styles.Control}>
          <Slider.Track className={styles.Track}>
            <Slider.Thumb className={styles.Thumb} />
            <Slider.Indicator className={styles.Indicator} />
            <Slider.Thumb className={styles.Thumb} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  );
}
