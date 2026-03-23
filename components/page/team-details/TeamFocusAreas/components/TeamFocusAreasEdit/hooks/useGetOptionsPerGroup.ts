import { useMemo } from 'react';

import { IFocusArea } from '@/types/shared.types';

import { SelectOption } from '../types';

export function useGetOptionsPerGroup(focusAreas: IFocusArea[]) {
  const optionsPerGroup = useMemo(() => {
    const map: Record<string, SelectOption[]> = {};
    focusAreas.forEach((parent) => {
      map[parent.uid] = (parent.children || []).map((child) => ({
        label: child.title,
        value: child.uid,
      }));
    });
    return map;
  }, [focusAreas]);

  return optionsPerGroup;
}
