import React, { PropsWithChildren } from 'react';
import { clsx } from 'clsx';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';

import s from './FormField.module.scss';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

interface Props extends PropsWithChildren {
  name: string;
  placeholder: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  isRequired?: boolean;
  onClick?: () => void;
  max?: number;
  clearable?: boolean;
  onClear?: () => void;
}

export const FormField = ({
  name,
  placeholder,
  label,
  description,
  disabled,
  children,
  isRequired,
  max,
  clearable,
  onClear,
  ...rest
}: Props) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext();
  const val = watch(name);

  useScrollIntoViewOnFocus<HTMLInputElement>({ id: name });

  const handleClear = () => {
    setValue(name, '', { shouldValidate: true });
    if (onClear) {
      onClear();
    }
  };

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
        })}
      >
        <div className={s.inputContent}>
          <Field.Control
            {...register(name)}
            disabled={disabled}
            placeholder={placeholder}
            className={s.inputElement}
            id={name}
            {...rest}
          />
        </div>
        {clearable && val && (
          <button type="button" className={s.clearButton} onClick={handleClear} aria-label="Clear">
            <ClearIcon />
          </button>
        )}
        {children}
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
        {max && val?.length > 0 && (
          <div className={s.counter}>
            {val?.length} / {max}
          </div>
        )}
      </div>
    </Field.Root>
  );
};

const ClearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 5L5 15M5 5L15 15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
