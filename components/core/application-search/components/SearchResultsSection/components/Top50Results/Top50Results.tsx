import React from 'react';

import { AllFoundItems } from '@/components/core/application-search/components/SearchResultsSection/types';

import { MAX_ITEMS_TO_SHOW } from './constants';

import { useGetGroupedItemsToRender } from './hooks/useGetGroupedItemsToRender';
import { getGroupTitleByGroupName } from './utils/getGroupTitleByGroupName';

import { SearchResultsItem } from '../SearchResultsItem';

import ls from './Top50Results.module.scss';
import s from '@/components/core/application-search/components/SearchResultsSection/SearchResultsSection.module.scss';

interface Props {
  items: AllFoundItems;
  onSelect?: () => void;
}

export function Top50Results(props: Props) {
  const { items, onSelect } = props;

  const { state, showAll: showAllItems } = useGetGroupedItemsToRender(items);

  return Object.entries(state).map(([groupName, groupState]) => {
    const { items, hasMore, showAll } = groupState;

    const groupTitle = getGroupTitleByGroupName(groupName);
    const itemsToShow = hasMore && !showAll ? items.slice(0, MAX_ITEMS_TO_SHOW) : items;

    return (
      <div key={groupName}>
        <div className={ls.groupTitle}>{groupTitle}</div>
        <ul className={s.list}>
          {itemsToShow.map((item) => (
            <SearchResultsItem key={item.uid} item={item} onSelect={onSelect} />
          ))}
        </ul>
        {hasMore && !showAll && (
          <button tabIndex={0} onClick={() => showAllItems(groupName)} className={ls.showAll}>
            Show all {groupTitle}
          </button>
        )}
      </div>
    );
  });
}
