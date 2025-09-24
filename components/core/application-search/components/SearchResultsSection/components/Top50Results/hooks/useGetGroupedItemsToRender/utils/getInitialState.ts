import { ForumFoundItem, FoundItem } from '@/services/search/types';

import { MAX_ITEMS_TO_SHOW } from '@/components/core/application-search/components/SearchResultsSection/components/Top50Results/constants';

import { State } from '../types';

export const getInitialState = (items: (FoundItem | ForumFoundItem)[]) => {
  const state = items.reduce((acc: State, item) => {
    const index = item.index;
    if (!acc[index]) {
      acc[index] = {
        items: [],
        hasMore: false,
        showAll: false,
      };
    }

    acc[index].items.push(item);

    if (acc[index].items.length > MAX_ITEMS_TO_SHOW) {
      acc[index].hasMore = true;
    }

    return acc;
  }, {});

  return state;
};
