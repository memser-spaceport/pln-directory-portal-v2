import React from 'react';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';

import Select, { GroupBase, OptionsOrGroups } from 'react-select';

import s from './FormSelect.module.scss';

interface Props {
  name: string;
  placeholder: string;
  label?: string;
  description?: string;
  options: OptionsOrGroups<string, GroupBase<string>>;
  disabled?: boolean;
}

export const FormSelect = ({ name, placeholder, label, description, options, disabled }: Props) => {
  const {
    watch,
    formState: { errors },
    setValue,
  } = useFormContext();

  const value = watch(name);

  return (
    <Field.Root className={s.field}>
      {label && <Field.Label className={s.label}>{label}</Field.Label>}
      <Select
        placeholder="Project"
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
            fontSize: '14px',
            minWidth: '140px',
            width: '100%',
            borderColor: 'rgba(203, 213, 225, 0.50) !important',
            position: 'relative',
            '&:hover': {
              border: '1px solid rgba(66, 125, 255, 0.50)',
              boxShadow: '0 0 0 4px rgba(21, 111, 247, 0.10)',
              borderColor: 'rgba(66, 125, 255, 0.50) !important',
            },
            '&:focus-visible, &:focus': {
              borderColor: 'rgba(66, 125, 255, 0.50) !important',
              boxShadow: '0 0 0 4px rgba(21, 111, 247, 0.10) !important',
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
            // background: 'tomato',
          }),
          option: (baseStyles) => ({
            ...baseStyles,
            fontSize: '14px',
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            outline: 'none',
            zIndex: 3,
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
