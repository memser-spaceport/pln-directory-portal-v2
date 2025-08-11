'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { clsx } from 'clsx';
import { useValidateOfficeHours } from '@/services/members/hooks/useValidateOfficeHours';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

import s from './OfficeHoursInput.module.scss';

interface Props {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  onValidationChange?: (isValidating: boolean) => void;
}

export const OfficeHoursInput = ({ name, label, placeholder, description, onValidationChange }: Props) => {
  const {
    register,
    watch,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useFormContext();
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const fieldValue = watch(name);
  const { mutateAsync: validateOfficeHours } = useValidateOfficeHours();

  // Debounced validation function
  const debouncedValidate = useCallback(
    debounce(async (value: string) => {
      if (!value || !value.trim()) {
        setValidationStatus('idle');
        setIsValidating(false);
        onValidationChange?.(false);
        clearErrors(name);
        return;
      }

      // Basic URL validation first
      try {
        new URL(value);
      } catch {
        setError(name, {
          type: 'manual',
          message: 'Please enter a valid URL',
        });
        setValidationStatus('invalid');
        setIsValidating(false);
        onValidationChange?.(false);
        return;
      }

      setIsValidating(true);
      onValidationChange?.(true);

      try {
        const result = await validateOfficeHours({ link: value });

        if (result?.status === 'OK') {
          setValidationStatus('valid');
          clearErrors(name);
        } else {
          setValidationStatus('invalid');
          setError(name, {
            type: 'manual',
            message: result?.error || 'This office hours link appears to be invalid or inaccessible',
          });
        }
      } catch (error) {
        setValidationStatus('invalid');
        setError(name, {
          type: 'manual',
          message: 'Unable to validate the office hours link. Please check the URL and try again.',
        });
      } finally {
        setIsValidating(false);
        onValidationChange?.(false);
      }
    }, 1000),
    [validateOfficeHours, setError, clearErrors, name],
  );

  // Trigger validation when field value changes
  useEffect(() => {
    if (fieldValue !== undefined) {
      debouncedValidate(fieldValue);
    }

    // Cleanup debounced function on unmount
    return () => {
      debouncedValidate.cancel();
    };
  }, [fieldValue, debouncedValidate]);

  const fieldError = errors[name];
  const hasError = !!fieldError;

  return (
    <div className={s.root}>
      <div className={s.labelWrapper}>
        <label className={s.label} htmlFor={name}>
          {label}
        </label>
        {isValidating && (
          <div className={s.validationStatus}>
            <LoaderIcon />
            <span className={s.validatingText}>Validating...</span>
          </div>
        )}
        {!isValidating && validationStatus === 'valid' && (
          <div className={clsx(s.validationStatus, s.valid)}>
            <CheckIcon />
            <span className={s.validText}>Valid link</span>
          </div>
        )}
        {!isValidating && validationStatus === 'invalid' && hasError && (
          <div className={clsx(s.validationStatus, s.invalid)}>
            <ErrorIcon />
            <span className={s.invalidText}>Invalid link</span>
          </div>
        )}
      </div>

      <input
        {...register(name)}
        id={name}
        type="url"
        placeholder={placeholder}
        className={clsx(s.input, {
          [s.error]: hasError,
          [s.valid]: validationStatus === 'valid' && !hasError,
          [s.validating]: isValidating,
        })}
      />

      {description && <p className={s.description}>{description}</p>}

      {hasError && <p className={s.errorMessage}>{fieldError?.message as string}</p>}
    </div>
  );
};

const LoaderIcon = () => <div className={s.loader} />;

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1L15 15H1L8 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 12H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
