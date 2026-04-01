'use client';

import FilterCount from '../../ui/filter-count';
import ViewType from '../../ui/view-type';
import useUpdateQueryParams from '../../../hooks/useUpdateQueryParams';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { EVENTS, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import { getAnalyticsUserInfo, getFilterCount, getQuery, triggerLoader } from '@/utils/common.utils';
import { SORT_OPTIONS } from '@/utils/projects.utils';
import Image from 'next/image';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import { SortDropdown } from '@/components/common/filters/SortDropdown';

const PROJECT_SORT_OPTIONS = [
  { value: SORT_OPTIONS.DEFAULT, label: 'Default' },
  { value: SORT_OPTIONS.ASCENDING, label: 'A-Z (Ascending)' },
  { value: SORT_OPTIONS.DESCENDING, label: 'Z-A (Descending)' },
];

const ProjectsToolbar = (props: any) => {
  //props
  const totalProjects = props?.totalProjects;
  const userInfo = props?.userInfo;
  const searchParams = props?.searchParams;

  const inputRef = useRef<HTMLInputElement>(null);
  const { updateQueryParams } = useUpdateQueryParams();

  const searchBy = searchParams['searchBy'] || '';
  const sortBy = searchParams['sort'] ?? SORT_OPTIONS.DEFAULT;
  const view = searchParams['viewType'] ?? VIEW_TYPE_OPTIONS.GRID;
  const query = getQuery(searchParams);
  const filterCount = getFilterCount(query);
  const analytics = useProjectAnalytics();

  const [searchInput, setSearchInput] = useState(searchBy);

  const onFilterClickHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_PROJECTS_FILTER, { detail: true }));
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e?.target?.value);
  };

  const onViewtypeClickHandler = (type: string) => {
    if (view === type) {
      return;
    }
    triggerLoader(true);
    analytics.onViewTypeClicked(getAnalyticsUserInfo(userInfo), type);
    if (type !== VIEW_TYPE_OPTIONS.GRID) {
      updateQueryParams('viewType', type, searchParams);
      return;
    }
    updateQueryParams('viewType', type, searchParams);
  };

  const onClearSearchClicked = () => {
    setSearchInput('');
    if (searchParams['searchBy']) {
      triggerLoader(true);
    }
    updateQueryParams('searchBy', '', searchParams);
  };

  const onSubmitHandler = (e: any) => {
    e.preventDefault();
    const inputVal = inputRef.current?.value?.trim() ?? '';

    if (searchBy.trim() !== inputVal) {
      triggerLoader(true);
    }
    analytics.onProjectSearchApplied(getAnalyticsUserInfo(userInfo), { search: inputVal });
    updateQueryParams('searchBy', inputVal, searchParams);
  };

  const onSortChange = (value: string) => {
    if (value === sortBy) return;
    triggerLoader(true);
    analytics.onSorByClicked(getAnalyticsUserInfo(userInfo), value);
    updateQueryParams('sort', value === SORT_OPTIONS.DEFAULT ? '' : value, searchParams);
  };

  useEffect(() => {
    if (searchBy) {
      inputRef.current?.focus();
    }
    setSearchInput(searchBy);
  }, [searchParams]);

  return (
    <>
      <div className="toolbar">
        <div className="toolbar__left">
          <button className="toolbar__left__filterbtn" onClick={onFilterClickHandler}>
            <img alt="filter" src="/icons/filter.svg" height={20} width={20}></img>
            {filterCount > 0 && <FilterCount count={filterCount} />}
          </button>
          <div className="toolbar__left__title-container">
            <h1 className="toolbar__left__title-container__title">Projects</h1>
            <p className="toolbar__left__title__container__count">({totalProjects})</p>
          </div>
          <div className="toolbar__left__search-container">
            <form className="toolbar__left__search-container__searchfrm" onSubmit={onSubmitHandler}>
              <input
                ref={inputRef}
                value={searchInput}
                onChange={(e) => onInputChange(e)}
                name="searchBy"
                className="toolbar__left__search-container__searchfrm__input"
                placeholder="Search for a Project"
                onFocus={(e) =>
                  e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)
                }
              />
              <div className="toolbar__left__search-container__searchfrm__optns">
                {searchInput && (
                  <button
                    type="button"
                    onClick={onClearSearchClicked}
                    className="toolbar__left__search-container__searchfrm__optns__clrbtn"
                  >
                    <Image loading="lazy" alt="close" src="/icons/close-gray.svg" height={16} width={16} />
                  </button>
                )}
                <button className="toolbar__left__search-container__searchfrm__searchbtn" type="submit">
                  <img alt="search" src="/icons/search.svg" height={16} width={16} />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="toolbar__right">
          <SortDropdown
            sortByLabel="Sort by:"
            options={PROJECT_SORT_OPTIONS}
            currentSort={sortBy}
            onSortChange={onSortChange}
          />
          <ViewType callback={onViewtypeClickHandler} view={view} />
        </div>
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

          .toolbar__left {
            display: flex;
            gap: 8px;
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
            display: none;
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
            width: 111px;
            background-color: #fff;
            color: black;
          }

          .toolbar__left__search-container__searchfrm__input:focus {
            outline: none;
          }

          .toolbar__left__search-container__searchfrm__searchbtn {
            border: none;
            background: #fff;
            height: inherit;
          }

          .toolbar__right {
            display: flex;
            gap: 8px;
            align-items: center;
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
            top: 0;
          }

          @media (min-width: 1024px) {
            .toolbar__right {
              gap: 16px;
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

export default ProjectsToolbar;
