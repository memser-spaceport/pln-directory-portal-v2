import React, { ChangeEvent, useRef, useState } from 'react';
import Image from 'next/image';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import useUpdateQueryParams from '@/hooks/useUpdateQueryParams';
import { ITeamsSearchParams } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import { useProjectAnalytics } from '@/analytics/project.analytics';

interface Props {
  searchParams: ITeamsSearchParams;
  userInfo: IUserInfo | undefined;
}

export const FiltersSearch = (props: Props) => {
  const searchParams = props?.searchParams;
  const userInfo = props?.userInfo;
  const searchBy = searchParams.searchBy || '';
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState(searchBy);
  const analytics = useProjectAnalytics();
  const { updateQueryParams } = useUpdateQueryParams();

  /**
   * Handles the input change event for the search field.
   * @param e - The change event.
   */
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e?.target?.value);
  };

  /**
   * Handles the form submission for searching members.
   * @param e - The submit event.
   */
  const onSubmitHandler = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (searchBy.trim() === searchInput.trim()) {
      return;
    }
    triggerLoader(true);
    analytics.onProjectSearchApplied(getAnalyticsUserInfo(userInfo), { search: searchInput });
    if (searchParams?.page) {
      searchParams.page = '1';
    }
    updateQueryParams('searchBy', searchInput, searchParams);
  };

  /**
   * Clears the search input field.
   */
  const onClearSearchClicked = () => {
    setSearchInput('');
    updateQueryParams('searchBy', '', searchParams);
  };

  return (
    <>
      <div className="toolbar__left__search-container">
        <form className="toolbar__left__search-container__searchfrm" onSubmit={onSubmitHandler} data-testid="search-form">
          <input
            ref={inputRef}
            value={searchInput}
            onChange={(e) => onInputChange(e)}
            className="toolbar__left__search-container__searchfrm__input"
            placeholder="Search by Member Name, Team, or Project"
            onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
            data-testid="search-input"
          />

          <div className="toolbar__left__search-container__searchfrm__optns">
            {searchInput && (
              <button title="Clear" type="button" onClick={onClearSearchClicked} className="toolbar__left__search-container__searchfrm__optns__clrbtn" data-testid="clear-search-button">
                <Image loading="lazy" alt="close" src="/icons/close-gray.svg" height={16} width={16} />
              </button>
            )}
            <button title="Search" className="toolbar__left__search-container__searchfrm__optns__sbtn" type="submit" data-testid="search-button">
              <Image loading="lazy" alt="search" src="/icons/search.svg" height={16} width={16} />
            </button>
          </div>
        </form>
      </div>

      <style jsx>
        {`
          .toolbar {
            display: flex;
            justify-content: space-between;
            height: 40px;
            gap: 8px;
            width: 100%;
          }

          .toolbar__right__web__sord-by__name {
            line-height: 20px; /* Added missing semicolon */
          }

          .toolbar__left {
            display: flex;
            gap: 8px;
          }

          .toolbar__right__web {
            display: none;
            color: #000;
          }

          .toolbar__right__web__sort-by-text {
            color: #000;
          }

          .toolbar__right__web__sort-by__icon {
            margin-top: 4px;
          }

          .toolbar__left__filterbtn {
            padding: 8px 12px 8px 12px;
            border: none;
            display: flex;
            gap: 8px;
            align-items: center;
            border-radius: 8px;
            background: #fff;
            height: inherit;
            box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.16);
          }

          .toolbar__left__title-container {
            display: none;
          }

          .toolbar__left__search-container {
            height: unset;
            border-radius: 4px;
            //box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.16);
            background: #fff;
          }

          .toolbar__left__search-container__searchfrm {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .toolbar__left__search-container__searchfrm__optns {
            display: flex;
            width: 40px;
            justify-content: end;
            position: relative;
            align-items: center;
            gap: 10px;
          }

          .toolbar__left__search-container__searchfrm__optns__clrbtn {
            background: inherit;
            outline: none;
            position: absolute;
            bottom: 0;
            height: 16px;
            left: 0;
          }

          .toolbar__left__search-container__searchfrm {
            display: flex;
            height: 40px;
            padding: 8px 2px;
            border-radius: 4px;
            align-items: center;
          }

          ::-webkit-input-placeholder {
            color: #94a3b8;
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
          }

          :-moz-placeholder {
            color: #94a3b8;
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
          }

          ::-moz-placeholder {
            color: #94a3b8;
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
          }

          :-ms-input-placeholder {
            color: #94a3b8;
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
          }

          ::input-placeholder {
            color: #94a3b8;
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
          }

          ::placeholder {
            color: #94a3b8;
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
          }

          .toolbar__left__search-container__searchfrm__input {
            border: none;
            width: 84px;
            background-color: #fff;
            color: black;
          }

          .toolbar__left__search-container__searchfrm__input:focus {
            outline: none;
          }

          .toolbar__left__search-container__searchfrm__optns__sbtn {
            border: none;
            background: #fff;
            height: inherit;
            height: 16px;
          }

          .toolbar__right {
            display: flex;
            gap: 8px;
          }

          .toolbar__right__mobile__sort-by {
            border-radius: 8px;
            background: #fff;
            box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.16);
            border: none;
            padding: 8px 12px;
            display: flex;
            height: 40px;
            align-items: center;
          }

          .toolbar__right__web__sort-by {
            background: #fff;
            color: #000;
            border: none;
          }

          @media (min-width: 480px) {
            .toolbar__left__search-container__searchfrm__input {
              width: 150px;
            }
          }

          @media (min-width: 1024px) {
            .toolbar__right__mobile {
              display: none;
            }

            .toolbar__right {
              gap: 16px;
            }

            .toolbar__right__web {
              display: flex;
              gap: 8px;
              align-items: center;
              position: relative;
            }

            .toolbar__right__web__sort-by {
              display: flex;
              height: 40px;
              padding: 8px 12px;
              align-items: center;
              gap: 8px;
              justify-content: space-between;
              border-radius: 8px;
              background: #fff;
              color: #000;
              border: none;
              box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.16);
              border: 1px solid #fff;
            }

            .toolbar__right__web__sort-by__name {
              color: #0f172a;
              font-size: 15px;
              font-weight: 400;
              line-height: 24px;
            }

            .toolbar__right__web__drop-downc {
              position: absolute;
              top: 45px;
              width: inherit;
              right: 0px;
              width: inherit;
            }

            .toolbar {
              background-color: #f1f5f9;
            }
            .toolbar__left {
              gap: 16px;
            }

            .toolbar__left__filterbtn {
              display: none;
            }

            .toolbar__left__title-container {
              display: unset;
              display: flex;
              gap: 8px;
              align-items: baseline;
            }

            .toolbar__left__search-container__searchfrm__input {
              width: 192px;
            }

            .toolbar__left__title-container__title {
              color: #0f172a;
              font-size: 28px;
              font-weight: 700;
              line-height: 40px;
            }

            .toolbar__left__title__container__count {
              color: #64748b;
              font-size: 14px;
              font-weight: 400;
              line-height: 20px;
            }
          }
        `}
      </style>
    </>
  );
};
