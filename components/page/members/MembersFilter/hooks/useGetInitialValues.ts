import { useMemo } from 'react';

import { Option } from '@/services/members/types';

import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';

import { useFilterStore } from '@/services/members/store';

export function useGetInitialValues(paramKey: string): Option[] {
  const { params } = useFilterStore();

  const initialValues = useMemo(() => {
    const paramValue = params.get(paramKey);
    if (!paramValue) return [];

    return paramValue.split(URL_QUERY_VALUE_SEPARATOR).map((value) => ({
      value: value.trim(),
      label: value.trim(),
    }));
  }, [params, paramKey]);

  return initialValues;
}
