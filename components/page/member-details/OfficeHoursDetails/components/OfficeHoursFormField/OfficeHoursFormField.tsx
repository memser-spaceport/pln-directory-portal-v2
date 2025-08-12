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
        {/*{showValidStatus && (*/}
        {/*  <div className={clsx(s.validationStatus, s.valid)}>*/}
        {/*    <CheckIcon />*/}
        {/*    <span className={s.validText}>Link is valid</span>*/}
        {/*  </div>*/}
        {/*)}*/}
        {/*{showInvalidStatus && (*/}
        {/*  <div className={clsx(s.validationStatus, s.invalid)}>*/}
        {/*    <ErrorIcon />*/}
        {/*    <span className={s.invalidText}>Link is invalid</span>*/}
        {/*  </div>*/}
        {/*)}*/}
      </div>

      <div className={s.inputWrapper}>
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
        {showValidStatus && <CheckIcon />}
      </div>

      {description && !hasError && !showValidStatus && <p className={s.description}>{description}</p>}

      {showValidStatus && <p className={s.successMessage}>Your booking link is active and ready to use.</p>}
      {hasError && <p className={s.errorMessage}>{fieldError?.message as string}</p>}
    </div>
  );
};

const LoaderIcon = () => <div className={s.loader} />;

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={s.checkIcon}>
    <path
      d="M14.3535 4.85354L6.35354 12.8535C6.3071 12.9 6.25196 12.9369 6.19126 12.9621C6.13056 12.9872 6.0655 13.0002 5.99979 13.0002C5.93408 13.0002 5.86902 12.9872 5.80832 12.9621C5.74762 12.9369 5.69248 12.9 5.64604 12.8535L2.14604 9.35354C2.05222 9.25972 1.99951 9.13247 1.99951 8.99979C1.99951 8.86711 2.05222 8.73986 2.14604 8.64604C2.23986 8.55222 2.36711 8.49951 2.49979 8.49951C2.63247 8.49951 2.75972 8.55222 2.85354 8.64604L5.99979 11.7929L13.646 4.14604C13.7399 4.05222 13.8671 3.99951 13.9998 3.99951C14.1325 3.99951 14.2597 4.05222 14.3535 4.14604C14.4474 4.23986 14.5001 4.36711 14.5001 4.49979C14.5001 4.63247 14.4474 4.75972 14.3535 4.85354Z"
      fill="#11A75C"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1L15 15H1L8 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 12H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
