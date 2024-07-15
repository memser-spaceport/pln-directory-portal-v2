import { useState } from 'react';

export interface IFocusArea {
  focusArea: any;
  focusAreas: any[];
  selectedItems: any[];
  onItemClickHandler: (item: any) => void;
  parents: any[];
  isGrandParent: boolean;
  description: string;
}
const FocusArea = (props: IFocusArea) => {
  const focusArea = props?.focusArea;
  const focusAreas = props?.focusAreas;
  const selectedItems = props?.selectedItems || [];
  const onItemClickHandler = props?.onItemClickHandler;
  const parents = props?.parents;
  const isGrandParent = props?.isGrandParent ?? false;
  const description = props?.description;

  const [isExpand, setIsExpand] = useState(false);
  const isSelectedItem = selectedItems.some((item: any) => item.uid === focusArea.uid);
  const isParent = parents.some((parent) => parent.uid === focusArea.uid);

  const onClickHandler = () => {
    setIsExpand(true);
    onItemClickHandler(focusArea);
  };

  const getIcon = () => {
    if (isParent) {
      return '/icons/minus-white.svg';
    }
    return '/icons/right-white.svg';
  };

  const getStyle = () => {
    if (isParent) return 'fa__cn__item__btn--parent';
    if (isSelectedItem) return 'fa__cn__item__btn--parent';
    return 'fa__cn__item__btn--default';
  };

  return (
    <>
      <div className="fa">
        <div className={`fa__cn  ${isExpand && isGrandParent ? 'fa__cn--expanded' : ''}`}>
          <div className={`fa__cn__item`}>
            <button
              type="submit"
              className={`fa__cn__item__btn ${getStyle()}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClickHandler();
              }}
            >
              {(isParent || isSelectedItem) && <img alt="mode" src={getIcon()} />}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpand(!isExpand);
              }}
              type="submit"
              className='fa__cn__item__toggleBtn'
            >
              {focusArea?.children.length > 0 && <img alt="expand" src={`${isExpand ? '/icons/down_arrow_blue.svg' : '/icons/right_arrow_blue.svg'}`} />}
            </button>

            <div className="fa__cn__item__title">
              <p className="fa__cn__item__title__text">{focusArea.title}</p>
            </div>

            {focusArea?.teamAncestorFocusAreas?.length > 0 && (
              <div className="w-fit rounded-[2px] bg-[#F1F5F9]">
                <p className="px-[5px] text-[10px] font-[500] leading-[14px] text-[#475569]">{focusArea?.teamAncestorFocusAreas?.length}</p>
              </div>
            )}
          </div>

          {isGrandParent && (
            <>
              {description && (
                <p className="fa__cn__selected">
                  <span className="fa__cn__selected__title">Selected: </span>
                  {description}
                </p>
              )}
            </>
          )}
        </div>
        {isExpand && (
          <>
            {focusArea?.children?.length > 0 && (
              <div className="fa__cn__children">
                {focusArea?.children?.map((chil: any, index: any) => (
                  <div key={`${index}+ ${chil}`}>
                    <FocusArea parents={parents} focusAreas={focusAreas} focusArea={chil} description="" isGrandParent={false} selectedItems={selectedItems} onItemClickHandler={onItemClickHandler} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <style jsx>
        {`
          .fa__cn {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
            padding: 12px 0;
          }

          .fa__cn--expanded {
            border-bottom: 1px solid #cbd5e1;
          }
          .fa__cn__selected {
            padding: 0 16px;
            font-size: 12px;
            font-weight: 500;
            color: #4d4d4d;
            // break-words
          }
          .fa__cn__selected__title {
            font-weight: 600;
          }
          .fa__cn__children {
            margin-left: 26px;
            border: 1px solid #cbd5e1;
          }
          .fa__cn__item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 16px;
          }
          .fa__cn__item__btn {
            display: flex;
            height: 20px;
            width: 20px;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            background:transparent;
          }

          .fa__cn__item__toggleBtn {
            background:transparent;
          }
          .fa__cn__item__btn--parent {
            background: #156ff7;
          }
          .fa__cn__item__btn--selected {
            background: #156ff7;
          }

          .fa__cn__item__btn--default {
            border-radius: 4px;
            border: 1px solid #cbd5e1;
          }
          .fa__cn__item__title {
            max-width: 85%;
            //break-words
          }
          .fa__cn__item__title__text {
            font-size: 14px;
            font-weight: 500;

            // leading-[24px] word-break
          }
        `}
      </style>
    </>
  );
};

export default FocusArea;
