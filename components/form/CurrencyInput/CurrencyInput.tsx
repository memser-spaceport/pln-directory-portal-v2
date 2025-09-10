import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { clsx } from 'clsx';
import { Field } from '@base-ui-components/react/field';

import s from './CurrencyInput.module.scss';

interface Props {
  defaultValue?: string;
  placeholder: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  isRequired?: boolean;
  currency?: string;
  name?: string;
}

export interface CurrencyInputRef {
  getValue: () => string;
  setValue: (value: string) => void;
  reset: () => void;
  getNumericValue: () => string;
  getCurrencyValue: () => string;
}

// Utility functions for currency formatting
const formatCurrency = (value: string, currency: string = 'USD'): string => {
  // Remove all non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d.]/g, '');

  if (!numericValue || numericValue === '.') {
    return '';
  }

  const number = parseFloat(numericValue);

  if (isNaN(number)) {
    return '';
  }

  // Format as currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number);
};

const formatNumberWithCommas = (value: string): string => {
  // Remove all non-numeric characters except decimal point
  const numericValue = value.replace(/[^\d.]/g, '');

  if (!numericValue) {
    return '';
  }

  // Split by decimal point
  const parts = numericValue.split('.');

  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Join back with decimal if it exists
  return parts.join('.');
};

const extractNumericValue = (formattedValue: string): string => {
  // Extract numeric value from formatted currency string
  return formattedValue.replace(/[^\d.]/g, '');
};

export const CurrencyInput = forwardRef<CurrencyInputRef, Props>(({
  defaultValue = '',
  placeholder,
  label,
  description,
  disabled = false,
  isRequired = false,
  currency = 'USD',
  name
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(defaultValue);
  const [internalValue, setInternalValue] = useState(defaultValue);

  useImperativeHandle(ref, () => ({
    getValue: () => internalValue,
    setValue: (value: string) => {
      setInternalValue(value);
      if (isFocused) {
        const formattedForEditing = formatNumberWithCommas(extractNumericValue(value));
        setDisplayValue(formattedForEditing);
      } else {
        const formattedValue = formatCurrency(value, currency);
        setDisplayValue(formattedValue);
      }
    },
    reset: () => {
      setInternalValue(defaultValue);
      setDisplayValue(defaultValue);
    },
    getNumericValue: () => extractNumericValue(internalValue),
    getCurrencyValue: () => formatCurrency(internalValue, currency)
  }));

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // When focused, show formatted number with commas for easier editing
    const numericValue = extractNumericValue(internalValue);
    const formattedForEditing = formatNumberWithCommas(numericValue);
    setDisplayValue(formattedForEditing);
  }, [internalValue]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // When blurred, format as currency and update internal value
    const formattedValue = formatCurrency(displayValue, currency);
    setDisplayValue(formattedValue);
    setInternalValue(formattedValue);
  }, [displayValue, currency]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (isFocused) {
        // While focused, format with commas for easier reading
        const formattedValue = formatNumberWithCommas(value);
        setDisplayValue(formattedValue);
        // Store the raw numeric value internally
        const numericValue = extractNumericValue(value);
        setInternalValue(numericValue);
      } else {
        setDisplayValue(value);
        setInternalValue(value);
      }
    },
    [isFocused],
  );

  return (
    <Field.Root className={s.field}>
      {label && (
        <div className={s.labelWrapper}>
          <Field.Label
            className={clsx(s.label, {
              [s.required]: isRequired,
            })}
          >
            {label}
          </Field.Label>
        </div>
      )}
      <div className={s.input}>
        <div className={s.inputContent}>
          <Field.Control
            disabled={disabled}
            placeholder={placeholder}
            className={s.inputElement}
            id={name}
            name={name}
            value={displayValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            type="text"
            inputMode="decimal"
          />
        </div>
      </div>
      <div className={s.sub}>
        <div>
          {description ? (
            <Field.Description className={s.fieldDescription}>{description}</Field.Description>
          ) : null}
        </div>
      </div>
      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={internalValue}
        />
      )}
    </Field.Root>
  );
});

CurrencyInput.displayName = 'CurrencyInput';
