import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Option } from '@/services/members/types';

import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';

import { useFilterStore } from '@/services/members/store';
import { useGetInitialValues } from '@/components/page/members/MembersFilter/hooks/useGetInitialValues';

import { CloseIcon, SearchIcon } from '@/components/icons';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';

import { useGetMergedItemsToRender } from './hooks/useGetMergedItemsToRender';

import { CheckboxListItem } from './components/CheckboxListItem';

import s from './FilterCheckboxListWithSearch.module.scss';

interface Props {
  label: string;
  paramKey: string;
  placeholder?: string;
  defaultItemsToShow: number;
  useGetDataHook: (input: string, limit?: number) => { data?: Option[] };
}

export function FilterCheckboxListWithSearch(props: Props) {
  const { label, paramKey, placeholder, useGetDataHook, defaultItemsToShow } = props;

  const [searchValue, setSearchValue] = useState('');

  const { setParam } = useFilterStore();
  const selectedValues = useGetInitialValues(paramKey);

  const { data = [] } = useGetDataHook(searchValue);

  const itemsToRender = useGetMergedItemsToRender({
    beData: data,
    selectedData: selectedValues,
    searchValue,
    defaultItemsToShow,
  });

  const methods = useForm<Record<string, any[]>>({
    defaultValues: { [paramKey]: selectedValues },
  });

  const { watch, setValue, reset } = methods;
  const filterValues = watch(paramKey);

  useEffect(() => {
    setValue(paramKey, selectedValues);
  }, []);

  useEffect(() => {
    if (filterValues && filterValues.length > 0) {
      const values = filterValues.map((item: any) => item.value).join(URL_QUERY_VALUE_SEPARATOR);
      setParam(paramKey, values);
    } else {
      setParam(paramKey, undefined);
    }
  }, [paramKey, filterValues]);

  return (
    <FormProvider {...methods}>
      <div>
        <div className={s.label}>{label}</div>
        <DebouncedInput
          value={searchValue}
          ids={{
            root: '',
            input: '',
          }}
          classes={{
            root: s.inputRoot,
            input: s.input,
            flushBtn: s.flushBtn,
            clearBtn: s.clearBtn,
          }}
          onChange={setSearchValue}
          placeholder={placeholder}
          hideFlushIconOnValueInput
          clearIcon={<CloseIcon color="#455468" />}
          flushIcon={<SearchIcon color="#455468" className={s.searchIcon} />}
        />
        <div className={s.list}>
          {itemsToRender.map((item) => {
            return (
              <CheckboxListItem
                key={item.value}
                item={item}
                values={selectedValues}
                setValue={setValue}
                paramKey={paramKey}
              />
            );
          })}
        </div>
      </div>
    </FormProvider>
  );
}
