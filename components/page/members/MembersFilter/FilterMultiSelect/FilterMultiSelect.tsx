'use client';

import React, { useState, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useGetRoles } from '@/services/members/hooks/useGetRoles';
import { useFilterStore } from '@/services/members/store';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import s from '@/components/page/recommendations/components/MatchesSelector/MatchesSelector.module.scss';
import Select from 'react-select';
import clsx from 'clsx';

interface Props {
  label: string;
  placeholder: string;
  paramKey: string;
  useDataHook?: (input: string) => { data?: any[] };
}

export function FilterMultiSelect({ label, placeholder, paramKey, useDataHook = useGetRoles }: Props) {
  const [inputValue, setInputValue] = useState('');
  const { params, setParam } = useFilterStore();

  // Get initial values from URL parameters
  const getInitialValues = () => {
    const paramValue = params.get(paramKey);
    if (!paramValue) return [];

    return paramValue.split(URL_QUERY_VALUE_SEPARATOR).map((value) => ({
      value: value.trim(),
      label: value.trim(),
    }));
  };

  const methods = useForm<Record<string, any[]>>({
    defaultValues: { [paramKey]: getInitialValues() },
  });

  const { watch, setValue, reset } = methods;
  const val = watch(paramKey);

  const { data: options = [] } = useDataHook(inputValue);

  // Sync form with URL parameters when they change
  useEffect(() => {
    const currentValues = getInitialValues();
    setValue(paramKey, currentValues);
  }, [params.get(paramKey), paramKey, setValue]);

  // Update URL parameters when form values change
  useEffect(() => {
    if (val && val.length > 0) {
      const values = val.map((item: any) => item.value).join(URL_QUERY_VALUE_SEPARATOR);
      setParam(paramKey, values);
    } else {
      setParam(paramKey, undefined);
    }
  }, [val, paramKey, setParam]);

  return (
    <FormProvider {...methods}>
      <form onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}>
        <div className={s.Content}>
          <div className={s.inputLabel}>{label}</div>
          <Select
            menuPlacement="auto"
            isMulti
            onInputChange={(value, actionMeta) => {
              if (actionMeta.action !== 'input-blur' && actionMeta.action !== 'menu-close' && actionMeta.action !== 'set-value') {
                setInputValue(value);
              }
            }}
            inputValue={inputValue}
            autoFocus
            options={options}
            isClearable={false}
            placeholder={placeholder}
            closeMenuOnSelect={false}
            blurInputOnSelect={false}
            value={val}
            onChange={(selectedOptions) => {
              setValue(paramKey, selectedOptions ? [...selectedOptions] : [], { shouldValidate: true, shouldDirty: true });
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
                  padding: '2px',
                },
              }),
              input: (baseStyles) => ({
                ...baseStyles,
                height: '28px',
                fontSize: '14px',
                padding: 0,
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
                padding: 'var(--spacing-4xs, 4px) 2px',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'var(--spacing-5xs, 2px)',
                borderRadius: 'var(--corner-radius-sm, 6px)',
                border: '1px solid var(--border-neutral-subtle, rgba(27, 56, 96, 0.12))',
                background: 'var(--background-base-white, #FFF)',
                boxShadow: '0px 1px 2px 0px var(--transparent-dark-6, rgba(14, 15, 17, 0.06))',
                margin: '0',
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
              indicatorsContainer: (base) => ({
                ...base,
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
        </div>
      </form>
    </FormProvider>
  );
}
