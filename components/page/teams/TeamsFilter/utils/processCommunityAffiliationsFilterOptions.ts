import filter from 'lodash/filter';

import { BaseFilterItem } from '@/services/teams/utils/createFilterGetter';

function movePLPortfolioFirst(items: BaseFilterItem[]) {
  let target = null;
  const rest = [];

  for (const item of items) {
    if (item.value === "PL Portfolio" && !target) {
      target = item;
    } else {
      rest.push(item);
    }
  }

  return target ? [target, ...rest] : items;
}

export function processCommunityAffiliationsFilterOptions(items: BaseFilterItem[]) {
  const sortedItems = movePLPortfolioFirst(items);
  const filteredItems = filter(sortedItems, (item) => !!item.count);

  return filteredItems;
}
