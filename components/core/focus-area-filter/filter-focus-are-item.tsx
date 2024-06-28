import { IFocusArea } from '@/types/shared.types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface FocusArea {
  item: IFocusArea;
  selectedItems: IFocusArea[];
  onItemClickHandler: (item: IFocusArea) => void;
  parents: IFocusArea[];
  uniqueKey: "teamAncestorFocusAreas" | "projectAncestorFocusAreas";
  isGrandParent: boolean;
  isHelpActive: boolean;
}
const FocusAreaItem = (props: FocusArea) => {
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

  const getStyle = () => {
    if (isParent) return 'isParent';
    if (isSelectedItem) return 'isSelected';
    return 'default';
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
  
    return currentItem.children.some((child: IFocusArea) =>
      (child?.[uniqueKey]?.length > 0) || hasSelectedItems(child)
    );
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
    <>
      <div className="fltitemcon">
        <div className={`fltitemcon__item`}>
          <button disabled={assignedItemsLength === 0} className={`filtitemcon__item__expbtn ${getStyle()}`} onClick={() => onCheckboxClickHandler()}>
            {(isParent || isSelectedItem) && <img alt="mode" src={getIcon()} />}
          </button>
          {(isChildrensAvailable || isGrandParent) && (
            <button disabled={!isChildrensAvailable} className={`filteritemcon__expbtn`} onClick={onExpandClickHandler}>
              <Image height={16} width={16} alt="expand" src={getExpandIcon()} />
            </button>
          )}

          <div className="fltitemcon__textc">
            <p className={`fltitemcon__textc__ttl ${assignedItemsLength === 0 ? 'textshade' : ''}`}>
              {currentItem.title}
              <span className="fltitemcont__textc__ttl__cnt">{assignedItemsLength}</span>
            </p>
          </div>
        </div>
        {isHelpActive && isGrandParent && currentItem?.description && (
          <div className="fltitemcon__descc">
            <p className="fltitemcon__descc__cnt">{currentItem.description}</p>
          </div>
        )}
      </div>
      {isExpand && (
        <>
          <>
            {currentItem?.children?.map(
              (child: IFocusArea, index: number) =>
                (child?.[uniqueKey]?.length > 0 || getIsSelectedItem(child)) && (
                  <div key={`${index}+ ${child}`} className="fltitem">
                    <FocusAreaItem
                      parents={parents}
                      item={child}
                      uniqueKey={uniqueKey}
                      isGrandParent={false}
                      isHelpActive={false}
                      selectedItems={selectedItems}
                      onItemClickHandler={onItemClickHandler}
                    />
                  </div>
                )
            )}
          </>
        </>
      )}

      <style jsx>
        {`
          button {
            outline: none;
            background: inherit;
            border: none;
          }
          .fltitemcon__item {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .filteritemcon__expbtn {
          pointer-events: ${!isChildrensAvailable ? 'none' : 'auto'}}

          .isParent {
            background-color: #156ff7;
          }

          .default {
            border-radisu: 4px;
            border: 1px solid #cbd5e1;
          }

          .isSelected {
            background-color: #156ff7;
          }

          .filtitemcon__item__expbtn {
            display: flex;
            height: 20px;
            width: 20px;
            min-width: 20px;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
          }

          .filteritemcon__expbtn {
            min-height: 16px;
            min-width: 16px;
          }

          .fltitemcon__textc {
            display: flex;
            gap: 6px;
          }

          .fltitemcon__textc__ttl {
            word-break: break-word;
            font-size: 12px;
            line-height: 14px;
          }

          .textshade {
            color: #94a3b8;
          }

          .fltitemcont__textc__ttl__cnt {
          margin-left: 6px;
          width: fit-content;
          border-radius: 2px;
          background-color: #F1F5F9;
          padding: 0 5px;
          font-size: 10px;
          font-weight: 500;
          line-height: 14px;
          coloe: #475569;
          }

          .fltitemcon__descc {
          margin-top: 12px;
          border-radius: 4px;
          background-color: #F1F5F9;
          padding: 8px;
          }

          .fltitemcon__descc__cnt {
          word-break: break-word;
          font-size: 12px;
          font-weight: 500;
          line-height: 17px;
          color: #475569;
          }

          .fltitem {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-left: 26px;}
        `}
      </style>
    </>
  );
};

export default FocusAreaItem;
