'use client';

import { IFilterSelectedItem, IUserInfo } from '@/types/shared.types';
import { ITeamFilterSelectedItems, ITeamsSearchParams } from '@/types/teams.types';
import { EVENTS, FOCUS_AREAS_FILTER_KEYS, PAGE_ROUTES, URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { useRouter, useSearchParams } from 'next/navigation';
import FilterCount from '../../ui/filter-count';
import Toggle from '../../ui/toogle';
import TagContainer from '../tag-container';
import { getAnalyticsUserInfo, getFilterCount, getQuery, triggerLoader } from '@/utils/common.utils';
import useUpdateQueryParams from '@/hooks/useUpdateQueryParams';
import Image from 'next/image';
import FocusAreaFilter from '../../core/focus-area-filter/focus-area-filter';
import { useTeamAnalytics } from '@/analytics/teams.analytics';

export interface ITeamFilterWeb {
  filterValues: ITeamFilterSelectedItems | undefined;
  userInfo: IUserInfo;
  searchParams: ITeamsSearchParams;
}

export interface ITeamFilterItem {
  value: string;
  selected: boolean;
  disabled: boolean;
}

const Filter = (props: ITeamFilterWeb) => {
  const filterValues = props?.filterValues;
  const userInfo = props?.userInfo;
  const searchParams = props?.searchParams;
  const selectedItems: any = {
    tags: filterValues?.tags.filter((item: IFilterSelectedItem) => item?.selected).map((item: IFilterSelectedItem) => item.value),
    membershipSources: filterValues?.membershipSources?.filter((item: IFilterSelectedItem) => item?.selected).map((item: IFilterSelectedItem) => item.value),
    fundingStage: filterValues?.fundingStage?.filter((item: IFilterSelectedItem) => item?.selected).map((item: IFilterSelectedItem) => item.value),
    technology: filterValues?.technology?.filter((item: IFilterSelectedItem) => item?.selected).map((item: IFilterSelectedItem) => item.value),
  };

  const router = useRouter();
  const { updateQueryParams } = useUpdateQueryParams();
  const analytics = useTeamAnalytics();

  const includeFriends = searchParams['includeFriends'] === 'true' || false;
  const includeOfficeHours = searchParams['officeHoursOnly'] === 'true' || false;
  const isRecent = searchParams['isRecent'] === 'true' || false;
  const query = getQuery(searchParams);
  const apliedFiltersCount = getFilterCount(query);

  const onIncludeFriendsToggle = () => {
    triggerLoader(true);
    if (searchParams?.page) {
      searchParams.page = '1';
    }
    if (!includeFriends) {
      analytics.onFriendsOfProtocolSelected();
      updateQueryParams('includeFriends', 'true', searchParams);
      return;
    }
    updateQueryParams('includeFriends', '', searchParams);
  };

  const onIsRecentToggle = () => {
    triggerLoader(true);
    if (searchParams?.page) {
      searchParams.page = '1';
    }
    if (!isRecent) {
      // analytics.onFriendsOfProtocolSelected();
      updateQueryParams('isRecent', 'true', searchParams);
      return;
    }
    updateQueryParams('isRecent', '', searchParams);
  };

  const onOfficeHoursToogle = () => {
    triggerLoader(true);
    if (searchParams?.page) {
      searchParams.page = '1';
    }
    if (!includeOfficeHours) {
      analytics.onOfficeHoursSelected();
      updateQueryParams('officeHoursOnly', 'true', searchParams);
      return;
    }
    updateQueryParams('officeHoursOnly', '', searchParams);
  };

  const onTagClickHandler = async (key: string, value: string, selected: boolean, from?: string) => {
    triggerLoader(true);
    if (searchParams?.page) {
      searchParams.page = '1';
    }
    try {
      if (selectedItems[key]?.includes(value)) {
        const filteredItems = selectedItems[key]?.filter((v: string) => v !== value);
        updateQueryParams(key, filteredItems.join(URL_QUERY_VALUE_SEPARATOR), searchParams);
        return;
      }
      const currentTags = [...selectedItems[key], value];
      updateQueryParams(key, currentTags.join(URL_QUERY_VALUE_SEPARATOR), searchParams);
      analytics.onFilterApplied(from,  value);
      return;
    } catch (error) {}
  };

  const onClearAllClicked = () => {
    if (apliedFiltersCount > 0) {
      triggerLoader(true);
      const current = new URLSearchParams(Object.entries(searchParams));
      const pathname = window?.location?.pathname;
      analytics.onClearAllFiltersClicked(getAnalyticsUserInfo(userInfo));
      const clearQuery = ['tags', 'membershipSources', 'fundingStage', 'technology', 'includeFriends', 'focusAreas', 'officeHoursOnly', 'isRecent'];
      clearQuery.forEach((query) => {
        if (current.has(query)) {
          current.delete(query);
        }
      });
      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${pathname}/${query}`);
      router.refresh()
    }
  };

  const onCloseClickHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_FILTER, { detail: false }));
    analytics.onTeamFilterCloseClicked();
  };

  const onShowClickHandler = () => {
    analytics.onTeamShowFilterResultClicked();
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_FILTER, { detail: false }));
  };

  return (
    <>
      <div className="team-filter">
        {/* Header */}
        <div className="team-filter__header">
          <h2 className="team-filter__header__title">
            Filters
            {apliedFiltersCount > 0 && <FilterCount count={apliedFiltersCount} />}
          </h2>
          <button className="team-fitlter__header__clear-all-btn" onClick={onClearAllClicked}>
            Clear filters
          </button>
          <button className="team-filter__header__closebtn" onClick={onCloseClickHandler}>
            <Image alt="close" src="/icons/close.svg" height={16} width={16} />
          </button>
        </div>

        {/* Body */}
        <div className="team-filter__body">
          <div className="team-filter__body__ohonly">
            <h3 className="team-filter__body__ohonly__title">Only Show Teams with Office Hours</h3>
            <div className="team-filter__body__ohonly__toogle">
              <Toggle height="16px" width="28px" callback={onOfficeHoursToogle} isChecked={includeOfficeHours} />
            </div>
          </div>
          {/* Include filter */}
          <div className="team-filter__body__includes">
            <h3 className="team-filter__body__includes__title">Include Friends of Protocol Labs</h3>
            <div className="pe__body__topic__select__toggle">
              <Toggle height="16px" width="28px" callback={onIncludeFriendsToggle} isChecked={includeFriends} />
            </div>
          </div>
          {/* New member filter */}
          <div className="team-filter__body__recent">
            <h3 className="team-filter__body__recent__title">New Teams</h3>
            <div className="pe__body__topic__select__toggle">
              <Toggle height="16px" width="28px" callback={onIsRecentToggle} isChecked={isRecent} />
            </div>
          </div>
          {/* Border line */}
          <div className="team-filter__bl"></div>

          <FocusAreaFilter
            title="Focus Area"
            uniqueKey={FOCUS_AREAS_FILTER_KEYS.teams as "teamAncestorFocusAreas" | "projectAncestorFocusAreas"}
            focusAreaRawData={filterValues?.focusAreas?.rawData}
            selectedItems={filterValues?.focusAreas?.selectedFocusAreas}
            searchParams={searchParams}
          />

          {/* Border line */}
          <div className="team-filter__bl"></div>

          <TagContainer page={PAGE_ROUTES.TEAMS} label="Tags" name="tags" items={filterValues?.tags ?? []} onTagClickHandler={onTagClickHandler} initialCount={10} userInfo={userInfo} />
          <div className="team-filter__bl"></div>
          <TagContainer
            page={PAGE_ROUTES.TEAMS}
            label="Membership Source"
            name="membershipSources"
            items={filterValues?.membershipSources ?? []}
            onTagClickHandler={onTagClickHandler}
            initialCount={10}
            userInfo={userInfo}
          />
          <div className="team-filter__bl"></div>
          <TagContainer
            page={PAGE_ROUTES.TEAMS}
            label="Funding Stage"
            name="fundingStage"
            items={filterValues?.fundingStage ?? []}
            onTagClickHandler={onTagClickHandler}
            initialCount={10}
            userInfo={userInfo}
          />
          <div className="team-filter__bl"></div>
          <TagContainer
            page={PAGE_ROUTES.TEAMS}
            label="Technology"
            name="technology"
            items={filterValues?.technology ?? []}
            onTagClickHandler={onTagClickHandler}
            initialCount={10}
            userInfo={userInfo}
          />
        </div>

        {/* Footer */}
        <div className="team-filter__footer">
          <button className="team-filter__footer__clrall" onClick={onClearAllClicked}>
            Clear filters
          </button>

          <button className="team-filter__footer__aply" onClick={onShowClickHandler}>
            View
          </button>
        </div>
      </div>
      <style jsx>
        {`
          button {
            background: none;
            border: none;
            border: none;
          }
          .team-filter {
            width: inherit;
            display: unset;
            position: fixed;
            border-right: 1px solid #e2e8f0;
            background: #fff;
            width: inherit;
            z-index: 3;
            height: 100%;
          }
          .team-filter__header {
            display: flex;
            padding: 20px 24px;
            width: 100%;
            justify-content: space-between;
            border-bottom: 1px solid #cbd5e1;
          }

          .team-filter__body {
            height: calc(100dvh - 100px);
            overflow: auto;
            padding: 0px 24px 10px 24px;
            flex-direction: column;
            display: flex;
            gap: 20px;
            padding-bottom: 50px;
          }

          .team-filter__header__title {
            color: #0f172a;
            font-size: 18px;
            font-weight: 600;
            line-height: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .team-fitlter__header__clear-all-btn {
            display: none;
          }
          .team-filter__bl {
            width: 100%;
            height: 1px;
            border-top: 1px solid #cbd5e1;
          }

          .team-filter__body__ohonly__title {
            color: #475569;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .team-filter__body__ohonly {
            margin-top: 20px;
            padding: 16px 0px 0px 0px;
            display: flex;
            align-items: center;
            gap: 12px;
            justify-content: space-between;
          }

          .team-filter__body__includes, .team-filter__body__recent{
            // padding: 0px 0px 16px 0px;
            display: flex;
            align-items: center;
            gap: 12px;
            justify-content: space-between;
          }

          .team-filter__body__includes__title, .team-filter__body__recent__title {
            color: #475569;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .team-filter__footer {
            position: absolute;
            box-shadow: 0px -2px 6px 0px #0f172a29;
            height: 60px;
            bottom: 0px;
            padding: 10px 24px;
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            background-color: white;
          }

          .team-filter__footer__clrall {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 24px;
            color: #0f172a;
            width: 50%;
            font-weight: 500;
            line-height: 20px;
          }

          .team-filter__footer__aply {
            background-color: #156ff7;
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            width: 50%;
            color: #fff;
          }

          @media (min-width: 1024px) {
            .team-filter__footer {
              display: none;
            }

            .team-filter__header {
              padding: 20px 34px;
            }

            .team-fitlter__header__clear-all-btn {
              display: unset;
              border: none;
              background: none;
              color: #156ff7;
              font-size: 13px;
              font-weight: 400;
              line-height: 20px;
            }

            .team-filter__body {
              padding: 0px 34px 10px 34px;
            }
            .team-filter__header__closebtn {
              display: none;
            }
            .team-filter__body {
              margin-bottom: 50px;
              width: 100%;
              overflow-x: hidden;
              height: calc(100dvh - 140px);
            }

            .team-filter__footer {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
};

export default Filter;
