import { useMemo } from 'react';

import { Option } from '@/services/members/types';

import { getInitialValues } from '@/components/page/members/MembersFilter/utils/getInitialValues';

import { useFilterStore } from '@/services/members/store';

export function useGetInitialValues(paramKey: string): Option[] {
  const { params } = useFilterStore();

  const initialValues = useMemo(() => getInitialValues(params, paramKey), [params, paramKey]);

  return initialValues;
}
