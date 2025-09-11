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
            <Slider.Thumb className={styles.Thumb}>
              <CaretLeft />
            </Slider.Thumb>
            <Slider.Indicator className={styles.Indicator} />
            <Slider.Thumb className={styles.Thumb}>
              <CaretRight />
            </Slider.Thumb>
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  );
}

const CaretLeft = () => (
  <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.22752 2.62534V11.3753C9.22759 11.4619 9.20196 11.5466 9.15389 11.6186C9.10583 11.6906 9.03747 11.7467 8.95749 11.7799C8.8775 11.813 8.78948 11.8217 8.70457 11.8048C8.61966 11.7879 8.54167 11.7461 8.48049 11.6849L4.10549 7.30988C4.06481 7.26924 4.03254 7.22099 4.01052 7.16788C3.98851 7.11477 3.97717 7.05784 3.97717 7.00035C3.97717 6.94285 3.98851 6.88592 4.01052 6.83281C4.03254 6.7797 4.06481 6.73145 4.10549 6.69081L8.48049 2.31581C8.54167 2.25456 8.61966 2.21284 8.70457 2.19593C8.78948 2.17902 8.8775 2.18768 8.95749 2.22082C9.03747 2.25396 9.10583 2.31009 9.15389 2.3821C9.20196 2.45411 9.22759 2.53877 9.22752 2.62534Z"
      fill="#1B4DFF"
    />
  </svg>
);

const CaretRight = () => (
  <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.8145 7.30988L6.43954 11.6849C6.37835 11.7461 6.30036 11.7879 6.21545 11.8048C6.13054 11.8217 6.04252 11.813 5.96253 11.7799C5.88255 11.7467 5.8142 11.6906 5.76613 11.6186C5.71806 11.5466 5.69244 11.4619 5.69251 11.3753V2.62534C5.69244 2.53877 5.71806 2.45411 5.76613 2.3821C5.8142 2.31009 5.88255 2.25396 5.96253 2.22082C6.04252 2.18768 6.13054 2.17902 6.21545 2.19593C6.30036 2.21284 6.37835 2.25456 6.43954 2.31581L10.8145 6.69081C10.8552 6.73145 10.8875 6.7797 10.9095 6.83281C10.9315 6.88592 10.9428 6.94285 10.9428 7.00035C10.9428 7.05784 10.9315 7.11477 10.9095 7.16788C10.8875 7.22099 10.8552 7.26924 10.8145 7.30988Z"
      fill="#1B4DFF"
    />
  </svg>
);
