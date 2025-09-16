import React from 'react';
import { useToggle } from 'react-use';

import { AllFoundItems } from '@/components/core/application-search/components/SearchResultsSection/types';

import { useGetGroupedItemsToRender } from './hooks/useGetGroupedItemsToRender';
import { getGroupTitleByGroupName } from './utils/getGroupTitleByGroupName';

import { SearchResultsItem } from '../SearchResultsItem';

import ls from './Top50Results.module.scss';
import s from '@/components/core/application-search/components/SearchResultsSection/SearchResultsSection.module.scss';

interface Props {
  items: AllFoundItems;
}

export function Top50Results(props: Props) {
  const { items } = props;

  const [showAll, toggleShowAll] = useToggle(false);

  const groupedItems = useGetGroupedItemsToRender(items, showAll);

  return (
    <>
      {Object.entries(groupedItems).map(([groupName, groupItems]) => (
        <div key={groupName}>
          <div className={ls.groupTitle}>{getGroupTitleByGroupName(groupName)}</div>
          <ul className={s.list}>
            {groupItems.map((item) => (
              <SearchResultsItem key={item.uid} item={item} />
            ))}
          </ul>
        </div>
      ))}
      {!showAll && (
        <button tabIndex={0} onClick={toggleShowAll} className={ls.showAll}>
          Show all results
        </button>
      )}
    </>
  );
}
