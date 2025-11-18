import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { IFocusArea } from '@/types/shared.types';
import { CaretRightIcon } from '@/components/icons';
import { CheckboxListItemRepresentation } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation';

import s from './FocusAreaItem.module.scss';

export interface FocusArea {
  item: IFocusArea;
  selectedItems: IFocusArea[];
  onItemClickHandler: (item: IFocusArea) => void;
  parents: IFocusArea[];
  uniqueKey: 'teamAncestorFocusAreas' | 'projectAncestorFocusAreas';
  isGrandParent: boolean;
  isHelpActive: boolean;
}

export const FocusAreaItem = (props: FocusArea) => {
  const currentItem = props?.item;
  const selectedItems = props?.selectedItems || [];
  const onItemClickHandler = props?.onItemClickHandler;
  const parents = props?.parents;
  const isGrandParent = props?.isGrandParent ?? false;
  const isHelpActive = props?.isHelpActive;
  const uniqueKey = props?.uniqueKey;
  const router = useRouter();
  const isParent = parents.some((parent) => parent.uid === currentItem.uid);

  const assignedItemsLength = currentItem?.[uniqueKey]?.length;
  const areChildrenAvailable = hasSelectedItems(currentItem);
  const isSelectedItem = getIsSelectedItem(currentItem);
  const [expanded, setExpanded] = useState((isSelectedItem && areChildrenAvailable) || false);

  useEffect(() => {
    if (isParent) {
      setExpanded(true);
    } else {
      setExpanded(isSelectedItem && areChildrenAvailable);
    }
  }, [router]);

  const onCheckboxClickHandler = () => {
    if (areChildrenAvailable) {
      setExpanded(true);
    } else {
      setExpanded(isSelectedItem && areChildrenAvailable);
    }
    onItemClickHandler(currentItem);
  };

  const onExpandClickHandler = () => {
    if (assignedItemsLength > 0) {
      setExpanded(!expanded);
    }
  };

  function hasSelectedItems(currentItem: IFocusArea): boolean {
    if (!currentItem || !currentItem.children) {
      return false;
    }

    return currentItem.children.some((child: IFocusArea) => child?.[uniqueKey]?.length > 0 || hasSelectedItems(child));
  }

  function getIsSelectedItem(cItem: IFocusArea) {
    return selectedItems.some((item) => item.parentUid === cItem.uid || item.uid === cItem.uid);
  }

  const expandControl = (areChildrenAvailable || isGrandParent) && (
    <button
      disabled={!areChildrenAvailable}
      className={clsx(s.expandButton, { [s.disabled]: !areChildrenAvailable })}
      onClick={(e) => {
        e.stopPropagation();
        onExpandClickHandler();
      }}
      title={expanded ? 'Collapse' : 'Expand'}
    >
      <CaretRightIcon
        className={clsx(s.expandIcon, {
          [s.expanded]: expanded,
        })}
      />
    </button>
  );

  return (
    <div className={s.root}>
      <CheckboxListItemRepresentation
        label={currentItem.title}
        count={assignedItemsLength}
        checked={isSelectedItem}
        indeterminate={isParent}
        disabled={assignedItemsLength === 0}
        ctrlEl={expandControl}
        onClick={onCheckboxClickHandler}
      />

      {isHelpActive && isGrandParent && currentItem?.description && (
        <div className={s.descriptionContainer}>
          <p className={s.description}>{currentItem.description}</p>
        </div>
      )}

      {expanded && (
        <div className={s.childrenContainer}>
          {currentItem?.children?.map(
            (child: IFocusArea, index: number) =>
              (child?.[uniqueKey]?.length > 0 || getIsSelectedItem(child)) && (
                <FocusAreaItem
                  key={`${child.uid}-${index}`}
                  parents={parents}
                  item={child}
                  uniqueKey={uniqueKey}
                  isGrandParent={false}
                  isHelpActive={false}
                  selectedItems={selectedItems}
                  onItemClickHandler={onItemClickHandler}
                />
              ),
          )}
        </div>
      )}
    </div>
  );
};
