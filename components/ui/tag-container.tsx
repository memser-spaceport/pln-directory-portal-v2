"use client";
import { useCommonAnalytics } from "@/analytics/common.analytics";
import { IFilterSelectedItem, IUserInfo } from "@/types/shared.types";
import { triggerLoader } from "@/utils/common.utils";
import { PAGE_ROUTES, PRIVATE_FILTERS } from "@/utils/constants";
import { useEffect, useState } from "react";
import { Tag } from "./tag";

interface ITagContainer {
  onTagClickHandler: (key: string, value: string, isSelected: boolean) => void;
  items: IFilterSelectedItem[];
  name: string;
  label: string;
  initialCount: number;
  userInfo: IUserInfo | undefined;
  isUserLoggedIn?: boolean;
  page: string
}

const TagContainer = (props: ITagContainer) => {
  const onTagClickHandler = props?.onTagClickHandler;
  const items = props?.items;
  const keyValue = props?.name;
  const label = props?.label;
  const initialCount = props?.initialCount;
  const userInfo = props?.userInfo;
  const isUserLoggedIn = props?.isUserLoggedIn ?? false;

  // const analytics = useCommonAnalytics();

  const isShowMore = items?.some((item: IFilterSelectedItem, index: number) => {
    return item?.selected && index > 9;
  });

  const [totalItems, setTotalItems] = useState(isShowMore ? items?.slice(0, items?.length) : items?.slice(0, initialCount));
  const showMoreOrLessCount = items?.length - totalItems?.length;

  const onShoreMoreAndLessClickHandler = () => {
    if (totalItems?.length < items?.length) {
      // analytics.onShowMoreClicked(window?.location?.pathname, label, getAnalyticsUserInfo(userInfo));
      setTotalItems(items);
      return;
    }
    setTotalItems(items?.slice(0, initialCount));
  };

  useEffect(() => {
    setTotalItems(isShowMore ? items?.slice(0, items?.length) : items?.slice(0, initialCount));
  }, [items]);

  const onMouseLeave = (id: string) => {
    const accessElement = document?.getElementById(id);
    if (accessElement) {
      accessElement.style.display = "none";
    }
  };

  const onMouseEnter = (id: string) => {
    const accessElement = document?.getElementById(id);
    if (accessElement && !isUserLoggedIn && PRIVATE_FILTERS.includes(keyValue)) {
      accessElement.style.display = "flex";
    }
  };

  const onLoginClickHandler = () => {
    // analytics.onLogInClicked(props?.page, "filter section")
    triggerLoader(true);
    // redirectToLogin();
  }

  return (
    <>
      <div className="tags-container" onMouseEnter={() => onMouseEnter(`tags-container__access-container${label}`)} onMouseLeave={() => onMouseLeave(`tags-container__access-container${label}`)}>
        <div className="tags-container__access-container" id={`tags-container__access-container${label}`}>
          <div className="tags-container__access-container__content">
            <img loading="lazy" alt="lock" src="/icons/lock.svg"/>
            <button onClick={onLoginClickHandler} className="tags-container__access-container__content__login-btn">Login </button> to access</div>
        </div>
        <h2 className="tags-container__title">{label}</h2>
        <div className="tags-container__tags">
          {totalItems?.map((item: IFilterSelectedItem, index: number) => (
            <div key={`${item} + ${index}`}>
              <Tag callback={onTagClickHandler} disabled={item?.disabled} selected={item?.selected} keyValue={keyValue} value={item?.value} variant="secondary" />
            </div>
          ))}
        </div>
        {/* Show More */}
        {items?.length > 10 && (
          <div className="tags-container__show-more">
            <button className="tags-container__show-more__btn" onClick={onShoreMoreAndLessClickHandler}>
              {items?.length > totalItems?.length ? "Show more" : "Show less"}
              <img loading="lazy" src="/icons/filter-dropdown.svg" height={16} width={16} />
            </button>
            {showMoreOrLessCount !== 0 && <Tag variant="primary" value={showMoreOrLessCount.toString()} />}
          </div>
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
        `}
      </style>
    </>
  );
};

export default TagContainer;
