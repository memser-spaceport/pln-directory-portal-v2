import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { IFocusArea } from '@/types/shared.types';

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

  const assignedItemsLength = currentItem?.[uniqueKey]?.length;
  const isChildrensAvailable = hasSelectedItems(currentItem);
  const isSelectedItem = getIsSelectedItem(currentItem);
  const [isExpand, setIsExpand] = useState((isSelectedItem && isChildrensAvailable) || false);

  useEffect(() => {
    if (isParent) {
      setIsExpand(true);
    } else {
      setIsExpand(isSelectedItem && isChildrensAvailable);
    }
  }, [router]);

  const isParent = parents.some((parent) => parent.uid === currentItem.uid);
  const onCheckboxClickHandler = () => {
    if (isChildrensAvailable) {
      setIsExpand(true);
    } else {
      setIsExpand(isSelectedItem && isChildrensAvailable);
    }
    onItemClickHandler(currentItem);
  };

  const getIcon = () => {
    if (isParent) {
      return '/icons/minus-white.svg';
    }
    return '/icons/right-white.svg';
  };

  /**
   * Gets the CSS class for the checkbox button based on its state.
   * @returns CSS class name
   */
  const getCheckboxStyle = () => {
    if (isParent) return s.isParent;
    if (isSelectedItem) return s.isSelected;
    return s.default;
  };

  const onExpandClickHandler = () => {
    if (assignedItemsLength > 0) {
      setIsExpand(!isExpand);
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

  const getExpandIcon = () => {
    if (!isChildrensAvailable) {
      return '/icons/right-arrow-gray-shaded.svg';
    }
    if (isExpand) {
      return '/icons/chevron-down-blue.svg';
    }
    return '/icons/chevron-right-grey.svg';
  };

  return (
    <div className={s.itemContainer}>
      <div className={s.item}>
        <button
          disabled={assignedItemsLength === 0}
          className={clsx(s.button, s.checkboxButton, getCheckboxStyle())}
          onClick={onCheckboxClickHandler}
          title={currentItem.title}
        >
          {(isParent || isSelectedItem) && <Image height={16} width={16} alt="mode" src={getIcon()} />}
        </button>

        {(isChildrensAvailable || isGrandParent) && (
          <button
            disabled={!isChildrensAvailable}
            className={clsx(s.button, s.expandButton, { [s.disabled]: !isChildrensAvailable })}
            onClick={onExpandClickHandler}
            title={isExpand ? 'Collapse' : 'Expand'}
          >
            <Image height={16} width={16} alt="expand" src={getExpandIcon()} />
          </button>
        )}

        <div className={s.textContainer}>
          <p className={clsx(s.title, { [s.textShade]: assignedItemsLength === 0 })}>
            {currentItem.title}
            <span className={s.count}>{assignedItemsLength}</span>
          </p>
        </div>
      </div>

      {isHelpActive && isGrandParent && currentItem?.description && (
        <div className={s.descriptionContainer}>
          <p className={s.description}>{currentItem.description}</p>
        </div>
      )}

      {isExpand && (
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
