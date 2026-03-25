import { clsx } from 'clsx';
import { useFormContext } from 'react-hook-form';
import React, { PropsWithChildren, ReactNode } from 'react';

import { Field } from '@base-ui-components/react/field';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

import s from './FormField.module.scss';

interface Props extends PropsWithChildren {
  name: string;
  placeholder: string;
  label?: string;
  description?: ReactNode;
  disabled?: boolean;
  isRequired?: boolean;
  onClick?: () => void;
  max?: number;
  clearable?: boolean;
  onClear?: () => void;
  rules?: Record<string, unknown>;
  icon?: ReactNode;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  descriptionPosition?: 'top' | 'bottom';
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
  rules,
  icon,
  onBlur,
  descriptionPosition = 'bottom',
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
    <Field.Root className={s.field} invalid={!!errors[name]}>
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
      {description && descriptionPosition === 'top' && (
        <Field.Description className={clsx(s.fieldDescription, s.fieldDescriptionTop)}>{description}</Field.Description>
      )}
      <div
        className={clsx(s.input, {
          [s.error]: !!errors[name],
          [s.hasIcon]: !!icon,
        })}
      >
        {icon && <span className={s.icon}>{icon}</span>}
        <div className={s.inputContent}>
          <Field.Control
            {...(() => {
              const registered = register(name, rules);
              if (!onBlur) return registered;
              return {
                ...registered,
                onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                  onBlur(e);
                  registered.onBlur(e);
                },
              };
            })()}
            disabled={disabled}
            placeholder={placeholder}
            className={clsx(s.inputElement, { [s.withIcon]: !!icon })}
            id={name}
            {...rest}
          />
        </div>
        {clearable && onClear && (
          <button type="button" className={s.clearButton} onClick={handleClear} aria-label="Clear">
            <ClearIcon />
          </button>
        )}
        {children}
      </div>
      <div className={s.sub}>
        <div>
          {!errors[name] && description && descriptionPosition === 'bottom' ? (
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
