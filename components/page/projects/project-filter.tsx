'use client';

import FilterCount from '../../ui/filter-count';
import useUpdateQueryParams from '../../../hooks/useUpdateQueryParams';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import useClickedOutside from '../../../hooks/useClickedOutside';
import { getAnalyticsUserInfo, getFilterCount, getQuery, triggerLoader } from '@/utils/common.utils';
import Toggle from '@/components/ui/toogle';
import { Autocomplete } from '@/components/ui/autocomplete';
import { getTeam, searchTeamsByName } from '@/services/teams.service';
import Image from 'next/image';
import { EVENTS, FOCUS_AREAS_FILTER_KEYS } from '@/utils/constants';
import FocusAreaFilter from '@/components/core/focus-area-filter/focus-area-filter';
import { useDebounce } from '@/hooks/useDebounce';
import { useProjectAnalytics } from '@/analytics/project.analytics';

const ProjectFilter = (props: any) => {
  //props
  const userInfo = props?.userInfo;
  const searchParams = props?.searchParams;
  const focusAreas = props?.focusAreas;
  //variables
  const { updateQueryParams } = useUpdateQueryParams();
  const query = getQuery(searchParams);
  const apliedFiltersCount = getFilterCount(query);
  const isRaisingFund = searchParams['funding'] ?? false;
  const isRecent = searchParams['isRecent'] ?? false;
  const teamId = searchParams['team'] ?? '';
  const router = useRouter();
  const projectTeamRef = useRef<HTMLInputElement>(null);
  const projectPaneRef = useRef<HTMLDivElement>(null);
  const analytics = useProjectAnalytics();


  //state
  const [searchResult, setSearchResult] = useState<any[]>(props?.initialTeams ?? []);
  const selectedTeam = props?.selectedTeam;
  const [searchText, setSearchText] = useState(selectedTeam?.label);
  const [isTeamActive, setIsTeamActive] = useState(false);
  const debouncedSearchText = useDebounce(searchText, 300);

  //methods
  useClickedOutside({ callback: () => setIsTeamActive(false), ref: projectPaneRef });

  const onCloseClickHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_PROJECTS_FILTER, { detail: false }));
    analytics.onProjectFilterCloseClicked(getAnalyticsUserInfo(userInfo));
  };

  const onShowClickHandler = () => {
    analytics.onProjectShowFilterResultClicked(getAnalyticsUserInfo(userInfo));
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_PROJECTS_FILTER, { detail: false }));
  };

  const onClearAllClicked = () => {
    if (apliedFiltersCount > 0) {
      setSearchText("");
      const current = new URLSearchParams(Object.entries(searchParams));
      const pathname = window?.location?.pathname;
      const clearQuery = ['team', 'funding', 'focusAreas', 'isRecent'];
      clearQuery.forEach((query) => {
        if (current.has(query)) {
          triggerLoader(true);
          current.delete(query);
        }
      });
      const search = current.toString();
      const query = search ? `?${search}` : '';
      analytics.onProjectFilterCleared(getAnalyticsUserInfo(userInfo));
      router.push(`${pathname}/${query}`);
      router.refresh()
      
    }
  };

  const onToggleClicked = () => {
    triggerLoader(true);
    if (!isRaisingFund) {
      updateQueryParams('funding', 'true', searchParams);
      analytics.onProjectFilterApplied(getAnalyticsUserInfo(userInfo), {
        raisingFunds: true,
      });
    } else {
      updateQueryParams('funding', '', searchParams);
      analytics.onProjectFilterApplied(getAnalyticsUserInfo(userInfo), {
        raisingFunds: false,
      });
    }
  };

  const onRecentToggleClicked = () => {
    triggerLoader(true);
    if (!isRecent) {
      updateQueryParams('isRecent', 'true', searchParams);
      analytics.onProjectFilterApplied(getAnalyticsUserInfo(userInfo), {
        isRecent: true,
      });
    } else {
      updateQueryParams('isRecent', '', searchParams);
      analytics.onProjectFilterApplied(getAnalyticsUserInfo(userInfo), {
        isRecent: false,
      });
    }
  };

  const onTeamSelected = (team: any) => {
    // setSelectedOption(team);
    setSearchText(team?.label);

    if(team.value !== searchParams["team"]) {
      triggerLoader(true);
    }

    if (team?.value) {
      updateQueryParams('team', team.value, searchParams);
      analytics.onProjectFilterApplied(getAnalyticsUserInfo(userInfo), {
        teamName: team?.label,
      });
    } else {
      updateQueryParams('team', '', searchParams);
    }
    setIsTeamActive(false);
  };

  const onAutocompleteBlur = () => {
    // if(selectedTeam?.label) {
    // setSearchText(selectedTeam.label);
    // }
  };

  const findTeamsByName = async (searchTerm: string) => {
    try {
      const results = await searchTeamsByName(searchTerm);
      setSearchResult(results);
    } catch (error) {
      console.error(error);
    }
  };

  const onTogglePane = (isActive: boolean) => {
    setIsTeamActive(isActive);
  };

  useEffect(() => {
    if (isTeamActive) {
      findTeamsByName(debouncedSearchText);
    }
  }, [debouncedSearchText]);


  const onClear = () => {
    setSearchText('');
    updateQueryParams("team", "", searchParams);
    findTeamsByName('');
  }

  useEffect(() => {
    setSearchText(selectedTeam?.label)
  }, [router, searchParams])

  return (
    <>
      <div className="project-filter">
        <div className="project-filter__header">
          <h2 className="project-filter__header__title">
            Filters
            {apliedFiltersCount > 0 && <FilterCount count={apliedFiltersCount} />}
          </h2>
          <button className="project-fitlter__header__clear" onClick={onClearAllClicked}>
            Clear filters
          </button>
          <button className="project-filter__header__closebtn" onClick={onCloseClickHandler}>
            <Image alt="close" src="/icons/close.svg" height={16} width={16} />
          </button>
        </div>
        <div className="project-filter__body">
        <div className="project-filter__body__raisingfund">
            <div className="project-filter__body__raisingfund__wrpr">
              <h3 className="project-filter__body__raisingfund__title">New Projects</h3>
            </div>
            <div className="project-filter__body__raisingfund__toggle">
              <Toggle height="16px" width="28px" callback={onRecentToggleClicked} isChecked={!!isRecent} />
            </div>
          </div>
          <FocusAreaFilter
            title="Focus Area"
            uniqueKey={FOCUS_AREAS_FILTER_KEYS.projects as 'teamAncestorFocusAreas' | 'projectAncestorFocusAreas'}
            focusAreaRawData={focusAreas?.rawData}
            selectedItems={focusAreas?.selectedFocusAreas}
            searchParams={searchParams}
          />
          <div className="project-filter__bl"></div>
          <div className="project-filter__body__raisingfund">
            <div className="project-filter__body__raisingfund__wrpr">
              <img src="/icons/raising-fund-indicator.svg" alt="fund-icon" />
              <h3 className="project-filter__body__raisingfund__title">Projects Raising Funds</h3>
            </div>
            <div className="project-filter__body__raisingfund__toggle">
              <Toggle height="16px" width="28px" callback={onToggleClicked} isChecked={!!isRaisingFund} />
            </div>
          </div>
          <div className="project-filter__bl"></div>
          <div className="project-filter__body__maintainer">
            Maintained By
            <Autocomplete
              selectedOption={selectedTeam}
              callback={onTeamSelected}
              isPaneActive={isTeamActive}
              inputRef={projectTeamRef}
              searchResult={searchResult}
              searchText={searchText}
              onTextChange={(text: string) => {
                setIsTeamActive(true);
                setSearchText(text);
              }}
              placeholder="Select Team"
              iconUrl="/icons/team-default-profile.svg"
              setIsPaneActive={onTogglePane}
              onInputBlur={onAutocompleteBlur}
              paneRef={projectPaneRef}
              onClear={onClear}
              isClear={(searchText || selectedTeam?.logo) ? true : false}
            />
          </div>
        </div>
        <div className="project-filter__footer">
          <button className="project-filter__footer__clrall" onClick={onClearAllClicked}>
            Clear filters
          </button>

          <button className="project-filter__footer__aply" onClick={onShowClickHandler}>
            View
          </button>
        </div>
      </div>
      <style jsx>{`
        .project-filter {
          display: unset;
          position: fixed;
          border-right: 1px solid #e2e8f0;
          background: #fff;
          width: inherit;
          z-index: 3;
          height: 100%;
        }
        .project-filter__header {
          display: flex;
          padding: 20px 34px;
          width: 100%;
          justify-content: space-between;
          border-bottom: 1px solid #cbd5e1;
        }

        .project-filter__header__title {
          color: #0f172a;
          font-size: 18px;
          font-weight: 600;
          line-height: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .project-filter__header__closebtn {
          background: transparent;
        }

        .project-fitlter__header__clear {
          display: none;
        }

        .project-filter__body {
          height: calc(100dvh - 130px);
          overflow: auto;
          padding: 20px 24px 10px 24px;
          flex-direction: column;
          display: flex;
          gap: 20px;
          padding-bottom: 50px;
        }

        .project-filter__body__raisingfund {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .project-filter__body__raisingfund__wrpr {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .project-filter__body__raisingfund__title {
          font-weight: 400;
          font-size: 14px;
          line-height: 20px;
          color: #475569;
        }

        .project-filter__body__maintainer {
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: black;
          font-weight: 600;
          font-size: 14px;
          line-height: 20px;
        }

        .project-filter__bl {
          width: 100%;
          height: 1px;
          border-top: 1px solid #cbd5e1;
        }

        .project-filter__footer {
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

        .project-filter__footer__clrall {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 24px;
          color: #0f172a;
          width: 50%;
          font-weight: 500;
          line-height: 20px;
          background: #fff;
        }

        .project-filter__footer__aply {
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
          .project-fitlter__header__clear {
            display: block;
            border: none;
            background: none;
            color: #156ff7;
            font-size: 13px;
            font-weight: 400;
            line-height: 20px;
          }
          .project-filter__body {
            margin-bottom: 50px;
            width: 100%;
            overflow-x: hidden;
            height: calc(100dvh - 140px);
            padding: 20px 34px 10px 34px;
          }
          .project-filter__header__closebtn {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default ProjectFilter;
