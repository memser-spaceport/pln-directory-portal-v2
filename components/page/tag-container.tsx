'use client';
import { IFilterSelectedItem, IUserInfo } from '@/types/shared.types';
import { PRIVATE_FILTERS } from '@/utils/constants';
import { useEffect, useState } from 'react';
import { Tag } from '../ui/tag';
import { triggerLoader } from '@/utils/common.utils';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import Image from 'next/image';
import Toggle from '../ui/toogle';

/**
 * Interface for TagContainer component props
 * @interface ITagContainer
 */
interface ITagContainer {
  onTagClickHandler: (key: string, value: string, selected: boolean, title?: string) => void;
  items: IFilterSelectedItem[];
  name: string;
  label: string;
  initialCount: number;
  userInfo: IUserInfo | undefined;
  isUserLoggedIn?: boolean;
  page: string;
  info?: string;
  toggleTitle?: string;
  IsToggleActive?: boolean;
  onIsActiveToggle?: (isActive: any) => void;
}

/**
 * TagContainer component displays a collection of selectable tags with show more/less functionality
 * 
 * Features:
 * - Displays tags with selected/unselected state
 * - Shows a limited number initially with option to expand
 * - Optional toggle feature for additional filtering
 * - Access control for private filters when user is not logged in
 * - Tooltip support for additional information
 * 
 * @param props - Component props as defined in ITagContainer
 * @returns React component
 */
const TagContainer = (props: ITagContainer) => {
  const onTagClickHandler = props?.onTagClickHandler;
  const items = props?.items;
  const keyValue = props?.name;
  const label = props?.label;
  const initialCount = props?.initialCount;
  const userInfo = props?.userInfo;
  const isUserLoggedIn = props?.isUserLoggedIn ?? false;

  const remainingItemsCount = items?.length - initialCount;

  const title = props?.toggleTitle;
  const isActive = props?.IsToggleActive ?? false;
  const onIsActiveToggle = props?.onIsActiveToggle ?? (() => { });

  //   const analytics = useCommonAnalytics();

  const [isShowMore, setIsShowMore] = useState(false);

  // const isShowMore = items?.some((item: IFilterSelectedItem, index: number) => {
  //   return item?.selected && index > 9;
  // });

  const onShoreMoreAndLessClickHandler = () => {
    setIsShowMore(!isShowMore);
  };

  /**
   * Hides the access container when mouse leaves
   * @param id - DOM element ID
   */
  const onMouseLeave = (id: string) => {
    const accessElement = document?.getElementById(id);
    if (accessElement) {
      accessElement.style.display = 'none';
    }
  };

  /**
   * Shows the access container when mouse enters (for private filters when user is not logged in)
   * @param id - DOM element ID
   */
  const onMouseEnter = (id: string) => {
    const accessElement = document?.getElementById(id);
    if (accessElement && !isUserLoggedIn && PRIVATE_FILTERS.includes(keyValue)) {
      accessElement.style.display = 'flex';
    }
  };

  /**
   * Handles click on the login button in the access container
   */
  const onLoginClickHandler = () => {
    // analytics.onLogInClicked(props?.page, "filter section")
  };

  return (
    <>
      <div className="tags-container" onMouseEnter={() => onMouseEnter(`tags-container__access-container${label}`)} onMouseLeave={() => onMouseLeave(`tags-container__access-container${label}`)}>
        <div className="tags-container__access-container" id={`tags-container__access-container${label}`}>
          <div className="tags-container__access-container__content">
            <img loading="lazy" alt="lock" src="/icons/lock.svg" />
            <button onClick={onLoginClickHandler} className="tags-container__access-container__content__login-btn">
              Login{' '}
            </button>{' '}
            to access
          </div>
        </div>
        <h2 className="tags-container__title">{label}
          {props?.info &&
            <Tooltip
              asChild
              trigger={
                <Image alt='left' height={16} width={16} src='/icons/info.svg' style={{ marginLeft: "5px", top: "2px", position: "relative" }} />
              }
              content={props?.info}
            />
          }
        </h2>

        {title && 
          <>
            <div className='tags-container__toggleCntr'>
              <div className="tags-container__toggleCntr__title">
                {title}
              </div>
              <div className="tags-container__toggleCntr__toggle">
                <Toggle height="16px" width="28px" callback={onIsActiveToggle} isChecked={isActive} />
              </div>
            </div>
            <div className="tags-container-filter__bl"></div>
          </>
        }

        <div className="tags-container__tags">
          {isShowMore && (
            <>
              {items?.map((item: IFilterSelectedItem, index: number) => (
                <div key={`${item} + ${index}`}>
                  <Tag callback={onTagClickHandler} from={label} disabled={item?.disabled} selected={item?.selected} keyValue={keyValue} value={item?.value} variant="secondary" />
                </div>
              ))}
            </>
          )}

          {!isShowMore && (
            <>
              {items?.slice(0, initialCount)?.map((item: IFilterSelectedItem, index: number) => (
                <div key={`${item} + ${index}`}>
                  <Tag callback={onTagClickHandler} from={label} disabled={item?.disabled} selected={item?.selected} keyValue={keyValue} value={item?.value} variant="secondary" />
                </div>
              ))}
            </>
          )}
        </div>
        {/* Show More */}
        {items?.length > 10 && remainingItemsCount >= 0 && (
          <div className="tags-container__show-more">
            <button className="tags-container__show-more__btn" onClick={onShoreMoreAndLessClickHandler}>
              {!isShowMore ? 'Show more' : 'Show less'}
              {!isShowMore ? <img loading="lazy" src="/icons/filter-dropdown.svg" height={16} width={16} /> : <img loading="lazy" src="/icons/arrow-up.svg" height={12} width={12} />}
            </button>
            {(remainingItemsCount !== 0 && !isShowMore) && <Tag variant="primary" value={remainingItemsCount.toString()} />}
          </div>
          // && remainingItemsCount >= 0 
        )}
      </div>
      <style jsx>
        {`
          .tags-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            position: relative;
          }

          .tags-container__access-container {
            position: absolute;
            z-index: 5;
            height: 100%;
            width: 100%;
            color: #fff;
            margin-right: 20px;
            background-color: rgba(0, 0, 0, 0.6);
            display: none;
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            align-items: center;
            border-radius: 8px;
            justify-content: center;
          }

          .tags-container__access-container__content {
            z-index: 10;
            margin: auto;
            display: flex;
            gap: 4px;
            align-items: center;
            font-size: 12px;
            position: absolute;
          }

          .tags-container__access-container__content__login-btn {
            background: none;
            border: none;
            color: white;
          }

          .tags-container__title {
            color: #0f172a;
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
            display: ${props?.info ? "flex" : "unset"};
          }

          .tags-container__tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .tags-container__show-more {
            display: flex;
            gap: 4px;
          }

          .bl {
            width: 100%;
            height: 1px;
            border-top: 1px solid #cbd5e1;
          }

          .tags-container__show-more__btn {
            color: #0f172a;
            font-size: 12px;
            font-weight: 600;
            line-height: 14px;
            display: flex;
            padding: 4px 0px;
            align-items: center;
            gap: 4px;
            border: none;
            background-color: #fff;
          }

          .tags-container__toggleCntr {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .tags-container__toggleCntr__title {
            color: #475569;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .tags-container-filter__bl {
            width: 100%;
            height: 1px;
            border-top: 1px solid #E2E8F0;
          }
        `}
      </style>
    </>
  );
};

export default TagContainer;
