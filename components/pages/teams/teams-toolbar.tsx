"use client";

import useClickedOutside from "@/hooks/useClickedOutside";
import useUpdateQueryParams from "@/hooks/useUpdateQueryParams";
import { IUserInfo } from "@/types/shared.types";
import { ITeamsSearchParams } from "@/types/teams.types";
import { getAnalyticsUserInfo, getFilterCount, getQuery, triggerLoader } from "@/utils/common.utils";
import { EVENTS, SORT_OPTIONS, VIEW_TYPE_OPTIONS } from "@/utils/constants";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import FilterCount from "../../ui/filter-count";
import SortByDropdown from "../../ui/sort-by-dropdown";
import ViewType from "../../ui/view-type";
import Image from "next/image";
import { useTeamAnalytics } from "@/analytics/teams.analytics";

interface IToolbar {
  searchParams: ITeamsSearchParams;
  totalTeams: number;
  userInfo: IUserInfo | undefined;
}

const TeamsToolbar = (props: IToolbar) => {
  const totalTeams = props?.totalTeams;
  const searchParams = props?.searchParams;
  const {updateQueryParams } = useUpdateQueryParams();
  const userInfo = props?.userInfo;

  const searchBy = searchParams.searchBy || "";
  const sortBy = searchParams.sort || SORT_OPTIONS.ASCENDING;
  const view = searchParams.viewType || VIEW_TYPE_OPTIONS.GRID;

  const inputRef = useRef<HTMLInputElement>(null);
  const sortByRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState(searchBy);
  const [isSortBy, setIsSortBy] = useState(false);

  useClickedOutside({ callback: () => setIsSortBy(false), ref: sortByRef });
  const analytics = useTeamAnalytics();

  const query = getQuery(searchParams);
  const filterCount = getFilterCount(query);

  const onFilterClickHandler = () => {
    analytics.onTeamOpenFilterPanelClicked(getAnalyticsUserInfo(userInfo))
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_FILTER, { detail: true }));
  };

  const onViewtypeClickHandler = (type: string) => {
    if (view === type) {
      return;
    }
    analytics.onTeamViewTypeChanged(type, getAnalyticsUserInfo(userInfo),);
    triggerLoader(true);
    if (type !== VIEW_TYPE_OPTIONS.GRID) {
      updateQueryParams("viewType", type, searchParams);
      return;
    }
    updateQueryParams("viewType", type, searchParams);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e?.target?.value);
  };

  const onSubmitHandler = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (searchBy.trim() === searchInput.trim()) {
      return;
    }
    triggerLoader(true);
    analytics.onTeamSearch(searchInput, getAnalyticsUserInfo(userInfo));
    if(searchParams?.page) {
      searchParams.page = "1";
    }
    updateQueryParams("searchBy", searchInput, searchParams);
  };

  const onSortClickHandler = (device: string) => {
    if (device === "mobile") {
      triggerLoader(true);
      if (sortBy === SORT_OPTIONS.ASCENDING) {
        analytics.onTeamSortByChanged("teams", SORT_OPTIONS.DESCENDING, getAnalyticsUserInfo(userInfo));
        updateQueryParams("sort", SORT_OPTIONS.DESCENDING, searchParams);
        return;
      }
      analytics.onTeamSortByChanged("teams", SORT_OPTIONS.ASCENDING, getAnalyticsUserInfo(userInfo));
      updateQueryParams("sort", "", searchParams);
    } else {
      setIsSortBy(!isSortBy);
    }
  };

  const onSortOptionClickHandler = (option: string) => {
    setIsSortBy(false);
    triggerLoader(true);
    analytics.onTeamSortByChanged("teams", option, getAnalyticsUserInfo(userInfo));
    updateQueryParams("sort", option, searchParams);
  };

  useEffect(() => {
    if(searchBy) {
      inputRef.current?.focus();
    }
    setSearchInput(searchBy);
  }, [searchParams]);

  return (
    <>
      <div className="toolbar">
        <div className="toolbar__left">
          <button className="toolbar__left__filterbtn" onClick={onFilterClickHandler}>
            <Image loading="lazy" alt="filter" src="/icons/filter.svg" height={20} width={20}></Image>
            {filterCount > 0 && <FilterCount count={filterCount}/>}
          </button>
          <div className="toolbar__left__title-container">
            <h1 className="toolbar__left__title-container__title">Teams</h1>
            <p className="toolbar__left__title__container__count">({totalTeams})</p>
          </div>
          <div className="toolbar__left__search-container">
            <form className="toolbar__left__search-container__searchfrm" onSubmit={onSubmitHandler}>
              <input
                ref={inputRef}
                value={searchInput}
                onChange={(e) => onInputChange(e)}
                className="toolbar__left__search-container__searchfrm__input"
                placeholder="Search"
                onFocus={(e) => e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
              />
              <button className="toolbar__left__search-container__searchfrm__searchbtn" type="submit">
                <Image loading="lazy" alt="search" src="/icons/search.svg" height={16} width={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="toolbar__right">
          <div className="toolbar__right__mobile">
            <button className="toolbar__right__mobile__sort-by" onClick={() => onSortClickHandler("mobile")}>
              {sortBy === SORT_OPTIONS.ASCENDING && <Image loading="lazy" alt="sort" src="/icons/ascending-gray.svg" height={20} width={20} />}
              {sortBy === SORT_OPTIONS.DESCENDING && <Image loading="lazy" alt="sort" src="/icons/descending-gray.svg" height={20} width={20} />}
            </button>
          </div>
          <div className="toolbar__right__web" ref={sortByRef} >
            <p className="toolbar__right__web__sort-by-text">Sort by:</p>
            <button className="toolbar__right__web__sort-by" onClick={() => onSortClickHandler("web")}>
              <Image loading="lazy" alt="sort" src={sortBy === SORT_OPTIONS.ASCENDING ? "/icons/ascending-gray.svg" : "/icons/descending-gray.svg"} height={20} width={20} />
              <p className="toolbar__right__web__sord-by__name">{sortBy === SORT_OPTIONS.ASCENDING ? "Ascending" : "Descending"}</p>
              <Image loading="lazy" alt="dropdown" src="/icons/dropdown-gray.svg" height={20} width={20}/>
            </button>
            {isSortBy && (
              <div className="toolbar__right__web__drop-downc">
                <SortByDropdown selectedItem={sortBy} callback={onSortOptionClickHandler} />
              </div>
            )}
          </div>
          <ViewType callback={onViewtypeClickHandler} view={view}/>
        </div>
      </div>

      <style jsx>
        {`
          .toolbar {
            display: flex;
            justify-content: space-between;
            height: 40px;
            gap: 8px;
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
            height: inherit;
            border-radius: 4px;
            background: #fff;
            box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.16);
            background: #fff;
          }

          .toolbar__left__search-container__searchfrm {
            display: flex;
            height: 40px;
            padding: 8px 12px;
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
            &:focus {
              outline: none;
            }
          }

          .toolbar__left__search-container__searchfrm__searchbtn {
            border: none;
            background: #fff;
            height: inherit;
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
              width: 160px;
              justify-content: space-between;
              border-radius: 8px;
              background: #fff;
              color: #000;
              border: none;
              box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.16);
              border: 1px solid #fff;

              &:focus {
                border: 1px solid #156ff7;
                box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.16), 0px 0px 0px 2px rgba(21, 111, 247, 0.25);
              }
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

export default TeamsToolbar;
