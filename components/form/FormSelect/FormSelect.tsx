import React from 'react';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';

import Select, { GroupBase, OptionsOrGroups } from 'react-select';

import s from './FormSelect.module.scss';
import { clsx } from 'clsx';

interface Props {
  name: string;
  placeholder: string;
  label?: string;
  description?: string;
  options: OptionsOrGroups<string, GroupBase<string>>;
  disabled?: boolean;
  isRequired?: boolean;
}

export const FormSelect = ({ name, placeholder, label, description, options, disabled, isRequired }: Props) => {
  const {
    watch,
    formState: { errors },
    setValue,
  } = useFormContext();

  const value = watch(name);

  return (
    <Field.Root className={s.field}>
      {label && (
        <Field.Label
          className={clsx(s.label, {
            [s.required]: isRequired,
          })}
        >
          {label}
        </Field.Label>
      )}
      <Select
        menuPlacement="auto"
        placeholder={placeholder}
        options={options}
        value={value}
        defaultValue={value}
        onChange={(val) => setValue(name, val, { shouldValidate: true, shouldDirty: true })}
        isDisabled={disabled}
        styles={{
          container: (base) => ({
            ...base,
            width: '100%',
          }),
          control: (baseStyles) => ({
            ...baseStyles,
            alignItems: 'center',
            gap: '8px',
            alignSelf: 'stretch',
            borderRadius: '8px',
            border: '1px solid rgba(203, 213, 225, 0.50)',
            background: '#fff',
            outline: 'none',
            minWidth: '140px',
            width: '100%',
            borderColor: 'rgba(203, 213, 225, 0.50) !important',
            position: 'relative',
            fontSize: '16px',
            color: '#455468',
            boxShadow: 'none !important',
            '&:hover': {
              border: '1px solid #5E718D',
              boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
              borderColor: '#5E718D !important',
            },
            '&:focus-visible, &:focus': {
              borderColor: '#5E718D !important',
              boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
            },
            ...(!!errors[name]
              ? {
                  borderColor: 'darkred !important',
                }
              : {}),
          }),
          input: (baseStyles) => ({
            ...baseStyles,
            height: '42px',
            padding: 0,
            fontSize: 16,
            // background: 'tomato',
          }),
          option: (baseStyles) => ({
            ...baseStyles,
            fontSize: '14px',
            fontWeight: 300,
            color: '#455468',
            '&:hover': {
              background: 'rgba(27, 56, 96, 0.12)',
            },
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            outline: 'none',
            zIndex: 3,
          }),
          placeholder: (baseStyles) => ({
            ...baseStyles,
            color: '#CBD5E1',
          }),
          indicatorSeparator: (base) => ({
            display: 'none',
          }),
        }}
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
