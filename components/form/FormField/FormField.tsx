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
}

export const FormField = ({ name, placeholder, label, description, disabled, children, isRequired, ...rest }: Props) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  useScrollIntoViewOnFocus<HTMLInputElement>({ id: name });

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
          <Field.Control {...register(name)} disabled={disabled} placeholder={placeholder} className={s.inputElement} id={name} {...rest} />
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
