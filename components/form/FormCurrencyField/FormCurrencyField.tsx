import React, { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';

import s from './FormCurrencyField.module.scss';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

interface Props {
  name: string;
  placeholder: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  isRequired?: boolean;
  currency?: string;
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

export const FormCurrencyField = ({ name, placeholder, label, description, disabled, isRequired, currency = 'USD' }: Props) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useFormContext();

  const currentValue = watch(name) || '';
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(currentValue);

  useScrollIntoViewOnFocus<HTMLInputElement>({ id: name });

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // When focused, show formatted number with commas for easier editing
    const numericValue = extractNumericValue(currentValue);
    const formattedForEditing = formatNumberWithCommas(numericValue);
    setDisplayValue(formattedForEditing);
  }, [currentValue]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // When blurred, format as currency and update form value
    const formattedValue = formatCurrency(displayValue, currency);
    setDisplayValue(formattedValue);
    setValue(name, formattedValue, { shouldDirty: true });
    trigger(name); // Trigger validation
  }, [displayValue, currency, name, setValue, trigger]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (isFocused) {
        // While focused, format with commas for easier reading
        const formattedValue = formatNumberWithCommas(value);
        setDisplayValue(formattedValue);
        // Store the raw numeric value in the form
        const numericValue = extractNumericValue(value);
        setValue(name, numericValue);
      } else {
        setDisplayValue(value);
      }
    },
    [isFocused, name, setValue],
  );

  // Register the field with react-hook-form
  const registration = register(name);

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
      <div
        className={clsx(s.input, {
          [s.error]: !!errors[name],
          [s.disabled]: disabled,
        })}
      >
        <div className={s.inputContent}>
          <Field.Control
            {...registration}
            disabled={disabled}
            placeholder={placeholder}
            className={s.inputElement}
            id={name}
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
          {!errors[name] && description ? (
            <Field.Description className={s.fieldDescription}>{description}</Field.Description>
          ) : (
            <Field.Error className={s.errorMsg} match={!!errors[name]}>
              {(errors?.[name]?.message as string) ?? ''}
            </Field.Error>
          )}
        </div>
      </div>
    </Field.Root>
  );
};
