import React from 'react';
import { clsx } from 'clsx';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';

import s from './FormField.module.scss';

interface Props {
  name: string;
  placeholder: string;
  label: string;
  description?: string;
}

export const FormField = ({ name, placeholder, label, description }: Props) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <Field.Root className={s.field}>
      <Field.Label className={s.label}>{label}</Field.Label>
      <Field.Control
        {...register(name)}
        placeholder={placeholder}
        className={clsx(s.input, {
          [s.error]: !!errors[name],
        })}
      />
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
