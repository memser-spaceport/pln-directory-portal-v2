import { useCallback } from 'react';
import { IFocusArea } from '@/types/shared.types';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import useUpdateQueryParams from '@/hooks/useUpdateQueryParams';
import { FocusAreaTreeItem } from './focusAreaAdapter';
import { findAllParents, findChildren } from '../utils';

interface UseFocusAreaToggleOptions {
  rootItems: FocusAreaTreeItem[];
  selectedItems: IFocusArea[];
  searchParams: any;
  onAnalytics?: (item: FocusAreaTreeItem) => void;
}

export function useFocusAreaToggle(options: UseFocusAreaToggleOptions) {
  const { rootItems, selectedItems, searchParams, onAnalytics } = options;
  const { updateQueryParams } = useUpdateQueryParams();

  const onToggle = useCallback(
    (item: FocusAreaTreeItem) => {
      const hasItem = selectedItems.some((s) => s.uid === item.id);
      let updatedTitles: string[];

      if (hasItem) {
        updatedTitles = selectedItems.filter((s) => s.uid !== item.id).map((s) => s.title);
      } else {
        const parents = findAllParents(rootItems, item.id);
        const children = findChildren(item);
        const idsToRemove = new Set([...parents, ...children].map((n) => n.id));
        const kept = selectedItems.filter((s) => !idsToRemove.has(s.uid));

        onAnalytics?.(item);

        updatedTitles = [...kept.map((s) => s.title), item.label];
      }

      const params = { ...searchParams };
      if (params.page) params.page = '1';
      updateQueryParams('focusAreas', updatedTitles.join(URL_QUERY_VALUE_SEPARATOR), params);
    },
    [rootItems, selectedItems, searchParams, updateQueryParams, onAnalytics],
  );

  return onToggle;
}
