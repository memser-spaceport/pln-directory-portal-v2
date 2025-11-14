import { useMemo } from 'react';
import uniqBy from 'lodash/uniqBy';
import isEmpty from 'lodash/isEmpty';

import { FilterOption } from '@/services/filters/commonTypes';

interface Input {
  beData: FilterOption[];
  selectedData: FilterOption[];
  searchValue: string;
  defaultItemsToShow: number;
}

export function useGetMergedItemsToRender(input: Input) {
  const { beData = [], selectedData = [], searchValue, defaultItemsToShow } = input;

  const result = useMemo(() => {
    const map = new Map<string, FilterOption>();
    const selectedNum = selectedData.length;

    for (const item of beData) {
      map.set(item.value, item);
    }

    const selected: FilterOption[] = selectedData.map((item) => {
      const beItem = map.get(item.value);
      return {
        ...item,
        count: beItem?.count ?? item.count,
      };
    });

    const rest: FilterOption[] = beData.filter((item) => !selectedData.some((s) => s.value === item.value));

    const result = [...selected, ...rest];

    if (isEmpty(searchValue) && result.length > defaultItemsToShow) {
      if (selectedNum > defaultItemsToShow) {
        return result.slice(0, selectedNum);
      }

      return result.slice(0, defaultItemsToShow);
    }

    return result;
  }, [beData, selectedData]);

  return result;
}
