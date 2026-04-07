import React, { PropsWithChildren } from 'react';
import { clsx } from 'clsx';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';

import s from './FormTextArea.module.scss';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

interface Props extends PropsWithChildren {
  name: string;
  placeholder: string;
  label?: string;
  description?: string | React.ReactNode;
  disabled?: boolean;
  isRequired?: boolean;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

export const FormTextArea = ({
  name,
  placeholder,
  label,
  description,
  disabled,
  children,
  isRequired,
  rows = 3,
  maxLength,
  showCharCount = false,
  ...rest
}: Props) => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();
  const val = watch(name);
  const currentText = (val as string) || '';
  const hasError = !!errors[name];
  const showCounter = showCharCount && maxLength != null && !hasError;

  useScrollIntoViewOnFocus<HTMLTextAreaElement>({ id: name });

  return (
    <Field.Root className={s.field} invalid={hasError}>
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
          [s.error]: hasError,
        })}
      >
        <div className={s.inputContent}>
          <textarea
            {...register(name)}
            aria-label={typeof label === 'string' ? label : undefined}
            disabled={disabled}
            placeholder={placeholder}
            className={s.inputElement}
            id={name}
            rows={rows}
            maxLength={maxLength}
            {...rest}
          />
        </div>
        {children}
      </div>
      {hasError && (
        <Field.Error className={s.errorMsg} match={hasError}>
          {(errors?.[name]?.message as string) ?? ''}
        </Field.Error>
      )}
      {showCounter && (
        <div className={clsx(s.descriptionRow, s.descriptionRowAfterInput)}>
          {description && <Field.Description className={s.fieldDescription}>{description}</Field.Description>}
          <span className={s.counter}>
            {currentText.length} / {maxLength}
          </span>
        </div>
      )}
      {!hasError && !showCounter && description && (
        <Field.Description className={s.fieldDescription}>{description}</Field.Description>
      )}
    </Field.Root>
  );
};
