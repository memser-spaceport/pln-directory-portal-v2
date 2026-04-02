import { clsx } from 'clsx';
import { useFormContext } from 'react-hook-form';
import React, { ReactNode, useState } from 'react';
import { Field } from '@base-ui-components/react/field';

import Select, { GroupBase, OptionsOrGroups, components } from 'react-select';

import { TRecommendationsSettingsForm } from '@/components/page/recommendations/components/RecommendationsSettingsForm/types';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

import s from './FormMultiSelect.module.scss';

export type MultiSelectOption = {
  label: string;
  value: string;
  image?: string | null;
};

interface Props {
  name: string;
  placeholder: string;
  label?: ReactNode;
  description?: string;
  options: MultiSelectOption[];
  disabled?: boolean;
  isRequired?: boolean;
  showNone?: boolean;
  noneLabel?: string;
  notFoundContent?: ReactNode;
}

const filterAndSort = (option: MultiSelectOption, input: string) => {
  if (!input) return true;

  return option.label.toLowerCase().includes(input.toLowerCase());
};

const CustomMultiValue = (props: any) => {
  return (
    <components.MultiValue {...props}>
      <span className={s.multiValueInner}>
        {props.data.image && (
          <img src={props.data.image} alt="" className={s.optionImage} />
        )}
        {props.data.label}
      </span>
    </components.MultiValue>
  );
};

export const FormMultiSelect = ({
  name,
  placeholder,
  label,
  description,
  options,
  disabled,
  isRequired,
  showNone,
  noneLabel = 'None',
  notFoundContent,
}: Props) => {
  const {
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext();

  const [inputValue, setInputValue] = useState('');
  const values = getValues();
  const val = values[name as keyof TRecommendationsSettingsForm] as { value: string; label: string }[];

  // Create None option if showNone is true
  const noneOption = { label: noneLabel, value: 'None' };

  // Sort filtered options by label dynamically
  const filteredOptions = [...options].filter((option) => filterAndSort(option, inputValue));
  const sortedOptions = filteredOptions.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

  // Add None option at the top if showNone is true
  const baseOptions = showNone ? [noneOption, ...sortedOptions] : sortedOptions;

  // Append notFoundContent as a special non-selectable option
  const finalOptions = React.useMemo(() => {
    if (notFoundContent) {
      return [
        ...baseOptions,
        {
          label: '',
          value: '__not_found_content__',
          isNotFoundContent: true,
        } as any,
      ];
    }
    return baseOptions;
  }, [baseOptions, notFoundContent]);

  useScrollIntoViewOnFocus<HTMLInputElement>({ id: name });

  return (
    <Field.Root className={s.field} invalid={!!errors[name]}>
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
        options={finalOptions}
        filterOption={(option) => {
          if ((option.data as any).isNotFoundContent) {
            return true;
          }
          return filterAndSort(option.data as MultiSelectOption, inputValue);
        }}
        isClearable={false}
        placeholder={placeholder}
        inputId={name}
        isDisabled={disabled}
        // @ts-ignore
        value={val}
        components={{
          MultiValue: CustomMultiValue,
          NoOptionsMessage: () => (
            <div className={s.notFound}>
              <span>No options found</span>
              {notFoundContent}
            </div>
          ),
          Option: (optionProps) => {
            if ((optionProps.data as any).isNotFoundContent) {
              return (
                <div className={s.notFoundContent}>
                  {notFoundContent}
                </div>
              );
            }
            return (
              <components.Option {...optionProps}>
                <span className={s.optionInner}>
                  {(optionProps.data as MultiSelectOption).image && (
                    <img
                      src={(optionProps.data as MultiSelectOption).image!}
                      alt=""
                      className={s.optionImage}
                    />
                  )}
                  {optionProps.data.label}
                </span>
              </components.Option>
            );
          },
        }}
        onChange={(newVal) => {
          // Filter out the special notFoundContent option
          const filtered = (newVal || []).filter(
            (option: any) => option.value !== '__not_found_content__',
          );
          if (!showNone) {
            // If showNone is false, use normal behavior
            setValue(name, filtered, { shouldValidate: true, shouldDirty: true });
            return;
          }

          const currentValues = filtered;
          const previousValues = val || [];

          // Check what was just selected by comparing current and previous values
          const noneSelected = currentValues.some(
            (option: { value: string; label: string }) => option.value === 'None',
          );
          const noneWasSelected = previousValues.some(
            (option: { value: string; label: string }) => option.value === 'None',
          );
          const otherOptionsSelected = currentValues.some(
            (option: { value: string; label: string }) => option.value !== 'None',
          );

          // If None was just selected (wasn't selected before, but is now)
          if (noneSelected && !noneWasSelected) {
            // Remove all other options, keep only None
            setValue(name, [noneOption], { shouldValidate: true, shouldDirty: true });
          }
          // If other options are selected while None is already selected
          else if (noneSelected && otherOptionsSelected && noneWasSelected) {
            // Remove None and keep the other options
            const filteredVal = currentValues.filter(
              (option: { value: string; label: string }) => option.value !== 'None',
            );
            setValue(name, filteredVal, { shouldValidate: true, shouldDirty: true });
          }
          // Normal case - no conflicts
          else {
            setValue(name, currentValues, { shouldValidate: true, shouldDirty: true });
          }
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
            ...(!!errors[name]
              ? {
                  borderColor: 'var(--action-border-error-focus) !important',
                }
              : {}),
            '> div': {
              gap: '2px',
              padding: '2px 4px',
            },
          }),
          input: (baseStyles) => ({
            ...baseStyles,
            height: '42px',
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
