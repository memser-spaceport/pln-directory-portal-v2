'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { clsx } from 'clsx';

import s from './OfficeHoursFormField.module.scss';

interface Props {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  validationCache: Map<string, { isValid: boolean; error?: string }>;
  isValidatingField?: boolean;
}

export const OfficeHoursFormField = ({ name, label, placeholder, description, validationCache, isValidatingField }: Props) => {
  const {
    register,
    watch,
    formState: { errors, isValidating },
  } = useFormContext();

  const fieldValue = watch(name);
  const fieldError = errors[name];
  const hasError = !!fieldError;

  // Check validation status from cache
  const cachedValidation = fieldValue ? validationCache.get(fieldValue) : null;

  // Show validating status when explicitly told or when form is validating this field
  const isFieldValidating = isValidatingField || (isValidating && fieldValue && !cachedValidation);

  const showValidStatus = cachedValidation && cachedValidation.isValid && !hasError && !isFieldValidating;
  const showInvalidStatus = cachedValidation && !cachedValidation.isValid && !isFieldValidating;

  return (
    <div className={s.root}>
      <div className={s.labelWrapper}>
        <label className={s.label} htmlFor={name}>
          {label}
        </label>
        {isFieldValidating && (
          <div className={s.validationStatus}>
            <LoaderIcon />
            <span className={s.validatingText}>Validating...</span>
          </div>
        )}
        {showValidStatus && (
          <div className={clsx(s.validationStatus, s.valid)}>
            <CheckIcon />
            <span className={s.validText}>Link is valid</span>
          </div>
        )}
        {showInvalidStatus && (
          <div className={clsx(s.validationStatus, s.invalid)}>
            <ErrorIcon />
            <span className={s.invalidText}>Link is invalid</span>
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
          [s.valid]: showValidStatus,
          [s.validating]: isFieldValidating,
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
