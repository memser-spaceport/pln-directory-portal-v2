import React, { PropsWithChildren } from 'react';
import { clsx } from 'clsx';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';

import s from './FormField.module.scss';

interface Props extends PropsWithChildren {
  name: string;
  placeholder: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const FormField = ({ name, placeholder, label, description, disabled, children }: Props) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <Field.Root className={s.field}>
      <div className={s.labelWrapper}>
        <Field.Label className={s.label}>{label}</Field.Label>
      </div>
      <div
        className={clsx(s.input, {
          [s.error]: !!errors[name],
        })}
      >
        <div className={s.inputContent}>
          <Field.Control {...register(name)} disabled={disabled} placeholder={placeholder} className={s.inputElement} />
        </div>
        {children}
      </div>
      {!errors[name] && description ? (
        <Field.Description className={s.fieldDescription}>{description}</Field.Description>
      ) : (
        <Field.Error className={s.errorMsg} match={!!errors[name]}>
          {(errors?.[name]?.message as string) ?? ''}
        </Field.Error>
      )}
    </Field.Root>
  );
};
