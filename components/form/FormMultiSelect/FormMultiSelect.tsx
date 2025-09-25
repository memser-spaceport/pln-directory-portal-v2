import React, { useState } from 'react';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';

import Select, { GroupBase, OptionsOrGroups } from 'react-select';

import s from './FormMultiSelect.module.scss';
import { clsx } from 'clsx';
import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';
import { useToggle } from 'react-use';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

interface Props {
  name: string;
  placeholder: string;
  label?: string;
  description?: string;
  options: { label: string; value: string }[];
  disabled?: boolean;
  isRequired?: boolean;
}

const filterAndSort = (option: { value: string; label: string }, input: string) => {
  if (!input) return true;

  return option.label.toLowerCase().includes(input.toLowerCase());
};

export const FormMultiSelect = ({ name, placeholder, label, description, options, disabled, isRequired }: Props) => {
  const {
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext();

  const [inputValue, setInputValue] = useState('');
  const values = getValues();
  const val = values[name as keyof TRecommendationsSettingsForm] as { value: string; label: string }[];

  // Sort filtered options by label dynamically
  const sortedOptions = [...options]
    .filter((option) => filterAndSort(option, inputValue))
    .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

  useScrollIntoViewOnFocus<HTMLInputElement>({ id: name });

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
        isMulti
        onInputChange={(value) => setInputValue(value)}
        inputValue={inputValue}
        // autoFocus
        options={sortedOptions}
        filterOption={() => true}
        isClearable={false}
        placeholder={placeholder}
        inputId={name}
        // @ts-ignore
        value={val}
        onChange={(val) => {
          setValue(name, val, { shouldValidate: true, shouldDirty: true });
        }}
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
            '> div': {
              gap: '2px',
              padding: '2px 4px',
            },
          }),
          input: (baseStyles) => ({
            ...baseStyles,
            height: '32px',
            fontSize: '14px',
            padding: 0,
            display: 'flex !important',
            '&:after': {
              display: 'none !important',
            },
          }),
          placeholder: (base) => ({
            ...base,
            width: 'fit-content',
            color: '#AFBACA',
            fontSize: '14px',
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
          multiValueRemove: (base) => ({
            ...base,
            height: '100%',
            cursor: 'pointer',
            '&:hover': {
              background: 'transparent',
            },
          }),
          multiValue: (base) => ({
            ...base,
            marginBlock: 0,
            display: 'flex',
            padding: 'var(--spacing-4xs, 4px) var(--spacing-3xs, 6px)',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--spacing-5xs, 2px)',
            borderRadius: 'var(--corner-radius-sm, 6px)',
            border: '1px solid var(--border-neutral-subtle, rgba(27, 56, 96, 0.12))',
            background: 'var(--background-base-white, #FFF)',
            boxShadow: '0px 1px 2px 0px var(--transparent-dark-6, rgba(14, 15, 17, 0.06))',
          }),
          multiValueLabel: (base) => ({
            ...base,
            fontSize: '14px',
            color: '#455468',
            fontWeight: 300,
            fontStyle: 'normal',
            letterSpacing: '-0.2px',
          }),
          indicatorSeparator: (base) => ({
            display: 'none',
          }),
        }}
        classNames={{
          placeholder: () =>
            clsx(s.placeholder, {
              [s.hidePlaceholder]: val.length > 0,
            }),
          control: () => s.control,
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
