import React, { useState } from 'react';
import Select, { components } from 'react-select';
import { clsx } from 'clsx';

interface Props {
  name: string;
  placeholder: string;
  label?: string;
  options: { label: string; value: string }[];
  disabled?: boolean;
  isRequired?: boolean;
  showNone?: boolean;
  noneLabel?: string;
  value?: { label: string; value: string }[];
  onChange?: (value: { label: string; value: string }[]) => void;
  variant?: 'primary' | 'secondary';
}

const filterAndSort = (option: { value: string; label: string }, input: string) => {
  if (!input) return true;
  return option.label.toLowerCase().includes(input.toLowerCase());
};

// Custom MultiValue component to handle None option display
const CustomMultiValue = (props: any) => {
  // If this is the None option, render as plain text
  if (props.data.value === 'None') {
    return (
      <div
        style={{
          color: '#455468',
          fontSize: '14px',
          fontWeight: 300,
          letterSpacing: '-0.2px',
          marginRight: '8px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {props.data.label}
      </div>
    );
  }

  // For all other options, use the default MultiValue component
  return <components.MultiValue {...props} />;
};

export const StandaloneMultiSelect = ({
  name,
  placeholder,
  label,
  options,
  disabled,
  isRequired,
  showNone,
  noneLabel = 'None',
  value = [],
  onChange,
  variant,
}: Props) => {
  const [inputValue, setInputValue] = useState('');

  // Create None option if showNone is true
  const noneOption = { label: noneLabel, value: 'None' };

  // Sort filtered options by label dynamically
  const filteredOptions = [...options].filter((option) => filterAndSort(option, inputValue));
  const sortedOptions = filteredOptions.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

  // Add None option at the top if showNone is true
  const finalOptions = showNone ? [noneOption, ...sortedOptions] : sortedOptions;

  const handleChange = (newVal: any) => {
    if (!showNone) {
      // If showNone is false, use normal behavior
      onChange?.(newVal || []);
      return;
    }

    const currentValues = newVal || [];
    const previousValues = value || [];

    // Check what was just selected by comparing current and previous values
    const noneSelected = currentValues.some((option: { value: string; label: string }) => option.value === 'None');
    const noneWasSelected = previousValues.some((option: { value: string; label: string }) => option.value === 'None');
    const otherOptionsSelected = currentValues.some(
      (option: { value: string; label: string }) => option.value !== 'None',
    );

    // If None was just selected (wasn't selected before, but is now)
    if (noneSelected && !noneWasSelected) {
      // Remove all other options, keep only None
      onChange?.([noneOption]);
    }
    // If other options are selected while None is already selected
    else if (noneSelected && otherOptionsSelected && noneWasSelected) {
      // Remove None and keep the other options
      const filteredVal = currentValues.filter((option: { value: string; label: string }) => option.value !== 'None');
      onChange?.(filteredVal);
    }
    // Normal case - no conflicts
    else {
      onChange?.(currentValues);
    }
  };

  return (
    <div className="standalone-multiselect">
      {label && (
        <label
          className={clsx('standalone-multiselect__label', {
            'standalone-multiselect__label--required': isRequired,
            secondary: variant === 'secondary',
          })}
        >
          {label}
        </label>
      )}
      <Select
        menuPlacement="auto"
        isMulti
        onInputChange={(value) => setInputValue(value)}
        inputValue={inputValue}
        options={finalOptions}
        filterOption={() => true}
        isClearable={false}
        placeholder={placeholder}
        inputId={name}
        isDisabled={disabled}
        value={value}
        components={{
          MultiValue: CustomMultiValue,
        }}
        onChange={handleChange}
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
            fontWeight: '400',
            lineHeight: '20px',
            letterSpacing: '-0.2px',
            minHeight: '44px',
            padding: '0 4px',
            boxShadow: 'none',
            '&:hover': {
              borderColor: 'rgba(203, 213, 225, 0.50)',
            },
          }),
          placeholder: (baseStyles) => ({
            ...baseStyles,
            color: '#94A3B8',
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '20px',
            letterSpacing: '-0.2px',
          }),
          multiValue: (baseStyles) => ({
            ...baseStyles,
            backgroundColor: '#F1F5F9',
            borderRadius: '6px',
            padding: '2px 6px',
            margin: '2px',
          }),
          multiValueLabel: (baseStyles) => ({
            ...baseStyles,
            color: '#475569',
            fontSize: '12px',
            fontWeight: '500',
            padding: '0',
          }),
          multiValueRemove: (baseStyles) => ({
            ...baseStyles,
            color: '#64748B',
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#EF4444',
            },
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.10), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
            zIndex: 9999,
          }),
          option: (baseStyles, { isFocused, isSelected }) => ({
            ...baseStyles,
            backgroundColor: isSelected ? '#156FF7' : isFocused ? '#F1F5F9' : 'white',
            color: isSelected ? 'white' : '#0F172A',
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '20px',
            letterSpacing: '-0.2px',
            padding: '8px 12px',
            '&:hover': {
              backgroundColor: isSelected ? '#156FF7' : '#F1F5F9',
            },
          }),
        }}
      />

      <style jsx>{`
        .standalone-multiselect {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .standalone-multiselect__label {
          color: #475569;
          font-feature-settings:
            'liga' off,
            'clig' off;
          font-size: 12px;
          font-style: normal;
          font-weight: 500;
          line-height: 20px; /* 166.667% */
          margin-bottom: 0.25rem;
        }

        .standalone-multiselect__label.secondary {
          color: #0f172a;
          font-size: 14px;
          font-style: normal;
          font-weight: 600;
          line-height: 20px; /* 142.857% */
        }

        .standalone-multiselect__label--required::after {
          content: '*';
          color: #ef4444;
          margin-left: 4px;
        }
      `}</style>
    </div>
  );
};
