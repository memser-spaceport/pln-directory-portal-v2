import { clsx } from 'clsx';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';
import React, { ReactNode, PropsWithChildren } from 'react';

import s from './FormEditor.module.scss';
import RichTextEditor from '@/components/ui/RichTextEditor/RichTextEditor';

interface Props extends PropsWithChildren {
  name: string;
  placeholder: string;
  label?: ReactNode;
  description?: string;
  disabled?: boolean;
  isRequired?: boolean;
  onClick?: () => void;
  autoFocus?: boolean;
  className?: string;
  classes?: {
    label?: string;
  };
}

export const FormEditor = (props: Props) => {
  const { name, label, classes, description, disabled, isRequired, autoFocus, className } = props;

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
            className={clsx(s.label, classes?.label, {
              [s.required]: isRequired,
            })}
          >
            {label}
          </Field.Label>
        </div>
      )}

      <RichTextEditor
        disabled={disabled}
        value={value}
        autoFocus={autoFocus}
        onChange={(txt) => setValue(name, txt, { shouldValidate: true, shouldDirty: true })}
        className={clsx(className, {
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
