import { useMemo } from 'react';
import reduce from 'lodash/reduce';

import { ForumFoundItem, FoundItem } from '@/services/search/types';
import { AllFoundItems } from '@/components/core/application-search/components/SearchResultsSection/types';

import { groupItemsByIndex } from './utils/groupItemsByIndex';

export type Acc = {
  items: Record<string, (FoundItem | ForumFoundItem)[]>;
  count: number;
};

const MAX_ITEMS_TO_SHOW = 5;

export function useGetGroupedItemsToRender(items: AllFoundItems, showAll: boolean) {
  const groupedItemsToRender = useMemo(() => {
    const initialGroupedItems = groupItemsByIndex(items);

    if (showAll) {
      return initialGroupedItems;
    }

    const { items: groupedItems } = reduce(
      initialGroupedItems,
      (acc: Acc, groupItems, groupName) => {
        if (acc.count >= MAX_ITEMS_TO_SHOW) {
          return acc;
        }

        const remaining = MAX_ITEMS_TO_SHOW - acc.count;
        const itemsForGroup = groupItems.slice(0, remaining);

        return {
          count: acc.count + itemsForGroup.length,
          items: {
            ...acc.items,
            [groupName]: itemsForGroup,
          },
        };
      },
      {
        count: 0,
        items: {},
      },
    );

    return groupedItems;
  }, [items, showAll]);

  return groupedItemsToRender;
}
