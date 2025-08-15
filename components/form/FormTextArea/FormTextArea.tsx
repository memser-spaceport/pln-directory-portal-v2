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
  description?: string;
  disabled?: boolean;
  isRequired?: boolean;
  rows?: number;
}

export const FormTextArea = ({ name, placeholder, label, description, disabled, children, isRequired, rows = 3, ...rest }: Props) => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext();
  const val = watch(name);

  useScrollIntoViewOnFocus<HTMLTextAreaElement>({ id: name });

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
          <textarea
            {...register(name)}
            disabled={disabled}
            placeholder={placeholder}
            className={s.inputElement}
            id={name}
            rows={rows}
            {...rest}
          />
        </div>
        {children}
      </div>
      {description && <div className={s.description}>{description}</div>}
      {errors[name] && <div className={s.errorMessage}>{errors[name]?.message as string}</div>}
    </Field.Root>
  );
};
