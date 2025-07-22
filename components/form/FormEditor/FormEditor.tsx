import React, { PropsWithChildren } from 'react';
import { clsx } from 'clsx';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';

import s from './FormEditor.module.scss';
import RichTextEditor from '@/components/ui/RichTextEditor/RichTextEditor';

interface Props extends PropsWithChildren {
  name: string;
  placeholder: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  isRequired?: boolean;
  onClick?: () => void;
}

export const FormEditor = ({ name, label, description, disabled, isRequired }: Props) => {
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();
  const value = watch(name);

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

      <RichTextEditor disabled={disabled} value={value} onChange={(txt) => setValue(name, txt, { shouldValidate: true, shouldDirty: true })} />
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
