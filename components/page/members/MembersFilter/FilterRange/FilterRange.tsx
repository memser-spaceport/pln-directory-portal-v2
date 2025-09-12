'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/services/members/store';
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
}

export function FilterRange({
  label,
  minParamName,
  maxParamName,
  allowedRange,
  formatValue = (value) => {
    if (value >= 1000000) {
      const millions = value / 1000000;
      return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
    } else if (value >= 1000) {
      const thousands = value / 1000;
      return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
    }
    return value.toString();
  },
}: Props) {
  const { params, setParam } = useFilterStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Slider state - numeric values for the slider
  const [sliderValues, setSliderValues] = useState<number[]>([allowedRange.min, allowedRange.max]);

  // Track the current parameter values to detect changes
  const currentMinParam = params.get(minParamName) || '';
  const currentMaxParam = params.get(maxParamName) || '';

  // Get initial values from URL parameters
  useEffect(() => {
    let newSliderMin = allowedRange.min;
    let newSliderMax = allowedRange.max;

    if (currentMinParam !== '') {
      const numericMin = parseFloat(currentMinParam);
      newSliderMin = numericMin;
    }

    if (currentMaxParam !== '') {
      const numericMax = parseFloat(currentMaxParam);
      newSliderMax = numericMax;
    }

    // Update slider values
    setSliderValues([newSliderMin, newSliderMax]);

    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [currentMinParam, currentMaxParam, isInitialized, allowedRange.min, allowedRange.max]);

  const handleSliderChange = useCallback(
    (values: number[]) => {
      const [newMin, newMax] = values;
      setSliderValues(values);

      // Update URL parameters directly
      if (newMin === allowedRange.min) {
        setParam(minParamName, undefined);
      } else {
        setParam(minParamName, newMin.toString());
      }

      if (newMax === allowedRange.max) {
        setParam(maxParamName, undefined);
      } else {
        setParam(maxParamName, newMax.toString());
      }
    },
    [setParam, minParamName, maxParamName, allowedRange.min, allowedRange.max],
  );

  // Generate the display text for current selection
  const getDisplayText = useCallback(() => {
    const minVal = currentMinParam !== '' ? parseFloat(currentMinParam) : allowedRange.min;
    const maxVal = currentMaxParam !== '' ? parseFloat(currentMaxParam) : allowedRange.max;

    const minDisplay = formatValue(minVal);
    const maxDisplay = formatValue(maxVal);

    if (minVal === allowedRange.min && maxVal === allowedRange.max) {
      return `${formatValue(allowedRange.min)} - ${formatValue(allowedRange.max)}+`;
    }

    return `${minDisplay} - ${maxDisplay}${maxVal === allowedRange.max ? '+' : ''}`;
  }, [currentMinParam, currentMaxParam, allowedRange.min, allowedRange.max, formatValue]);

  return (
    <div className={styles.container}>
      <div className={styles.rangeDisplay}>
        <span className={styles.rangeText}>{getDisplayText()}</span>
      </div>

      <Slider.Root className={styles.sliderContainer} step={25000} value={sliderValues} onValueChange={handleSliderChange} min={allowedRange.min} max={allowedRange.max}>
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
