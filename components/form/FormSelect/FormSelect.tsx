import React from 'react';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';

import Select, { GroupBase, OptionsOrGroups } from 'react-select';

import s from './FormSelect.module.scss';

interface Props {
  name: string;
  placeholder: string;
  label: string;
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

  console.log(errors);

  const value = watch(name);

  return (
    <Field.Root className={s.field}>
      <Field.Label className={s.label}>{label}</Field.Label>
      <Select
        placeholder="Project"
        options={options}
        value={value}
        onChange={(val) => setValue(name, val, { shouldValidate: true })}
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
            position: 'relative',
            '&:hover': {
              border: '1px solid rgba(66, 125, 255, 0.50)',
              boxShadow: '0 0 0 4px rgba(21, 111, 247, 0.10)',
            },
            '&:focus-visible, &:focus': {
              border: '1px solid rgba(203, 213, 225, 0.50)',
              boxShadow: '0 0 0 4px rgba(21, 111, 247, 0.10)',
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
