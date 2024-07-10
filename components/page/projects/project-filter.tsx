'use client';

import FilterCount from '../../ui/filter-count';
import useUpdateQueryParams from '../../../hooks/useUpdateQueryParams';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import useClickedOutside from '../../../hooks/useClickedOutside';
import { triggerLoader } from '@/utils/common.utils';
import Toggle from '@/components/ui/toogle';

const ProjectFilter = (props: any) => {
  //props
  const userInfo = props?.userInfo;
  const searchParams = props?.searchParams;

  //variables
  const { updateQueryParams } = useUpdateQueryParams();
  const appliedFiltersCount = 0;
  const isRaisingFund = searchParams['funding'] ?? false;
  const teamId = searchParams['team'] ?? '';
  const router = useRouter();
  const projectTeamRef = useRef<HTMLInputElement>(null);
  const projectPaneRef = useRef<HTMLDivElement>(null);
  // const analytics = useProjectListAnalytics();

  //state
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedOption, setSelectedOption] = useState<any>({ label: '', value: '', logo: '' });
  const [isTeamActive, setIsTeamActive] = useState(false);

  //methods
  useClickedOutside({ callback: () => setIsTeamActive(false), ref: projectPaneRef });

  const onClearAllClicked = () => {
    if (searchParams?.size) {
      const current = new URLSearchParams(Object.entries(searchParams));
      const pathname = window?.location?.pathname;
      const clearQuery = ['team', 'funding'];
      clearQuery.forEach((query) => {
        if (current.has(query)) {
          triggerLoader(true);
          current.delete(query);
        }
      });
      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${pathname}/${query}`);
      // analytics.onClearAllClicked(getAnalyticsUserInfo(userInfo));
    }
  };

  const onToggleClicked = () => {
    triggerLoader(true);
    if (!isRaisingFund) {
      updateQueryParams('funding', 'true', searchParams);
      // analytics.onFundingRequiredToggleClicked(getAnalyticsUserInfo(userInfo), true);
    } else {
      updateQueryParams('funding', '', searchParams);
      // analytics.onFundingRequiredToggleClicked(getAnalyticsUserInfo(userInfo), false);
    }
  };

  const onTeamSelected = (team: any) => {
    setSelectedOption(team);
    if (team?.value) {
      updateQueryParams('team', team.value, searchParams);
      // analytics.onTeamSelected(getAnalyticsUserInfo(userInfo), team);
    } else {
      updateQueryParams('team', '', searchParams);
      // analytics.onTeamSelected(getAnalyticsUserInfo(userInfo), '');
    }
  };

  const onAutocompleteBlur = () => {
    setSearchText(selectedOption.label);
  };

  // const findTeamsByName = async (searchTerm: string) => {
  //   setIsTeamActive(true);
  //   setSearchText(searchTerm);
  //   try {
  //     const results = await searchTeamsByName(searchTerm);
  //     setSearchResult(results);
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const onTogglePane = (isActive: boolean) => {
  //   setIsTeamActive(isActive);
  //   if (isActive) {
  //     findTeamsByName(searchText);
  //   }
  // };

  // useEffect(() => {
  //   if (teamId) {
  //     const getTeamDetail = async (teamId: string) => {
  //       const teamResponse = await getTeam(teamId, {
  //         with: 'logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member',
  //       });
  //       if (teamResponse.error) {
  //         return;
  //       }
  //       const formattedTeam = teamResponse?.data?.formatedData;
  //       setSelectedOption({ label: formattedTeam?.name, value: formattedTeam?.id, logo: formattedTeam?.logo });
  //       setSearchText(formattedTeam?.name);
  //       setIsTeamActive(false);
  //     };
  //     getTeamDetail(teamId ?? '');
  //   } else {
  //     setSelectedOption({ label: '', value: '', logo: '' });
  //     setSearchText('');
  //   }
  // }, [teamId]);

  return (
    <>
      <div className="project-filter">
        <div className="project-filter__header">
          <h2 className="project-filter__header__title">
            Filters
            {appliedFiltersCount > 0 && <FilterCount count={appliedFiltersCount} />}
          </h2>
          <button className="project-fitlter__header__clear" onClick={onClearAllClicked}>
            Clear all
          </button>
        </div>
        <div className="project-filter__body">
          <div className="project-filter__body__raisingfund">
            <img src="/icons/raising-fund-indicator.svg" alt="fund-icon" />
            <h3 className="project-filter__body__raisingfund__title">Projects Raising Funds</h3>
            <div className="project-filter__body__raisingfund__toggle">
              <Toggle height="16px" width="28px" callback={onToggleClicked} isChecked={!!isRaisingFund} />
            </div>
          </div>
          <div className="project-filter__bl"></div>
          <div className="project-filter__body__maintainer">
            {/* <label className="project-filter__body__maintainer">
              Maintained By
              <Autocomplete
                selectedOption={selectedOption}
                callback={onTeamSelected}
                isPaneActive={isTeamActive}
                inputRef={projectTeamRef}
                searchResult={searchResult}
                searchText={searchText}
                onTextChange={(text: string) => findTeamsByName(text)}
                placeholder="Select Team"
                iconUrl="/icons/nav/unSelected/team.svg"
                setIsPaneActive={onTogglePane}
                onInputBlur={onAutocompleteBlur}
                paneRef={projectPaneRef}
              />
            </label> */}
          </div>
        </div>
      </div>
      <style jsx>{`
        .project-filter {
          width: inherit;
          display: unset;
          position: fixed;
          border-right: 1px solid #e2e8f0;
          background: #fff;
          width: inherit;
          z-index: 3;
          height: calc(100vh - 80px);
        }
        .project-filter__header {
          display: flex;
          padding: 20px 34px;
          width: 100%;
          justify-content: space-between;
          border-bottom: 1px solid #cbd5e1;
        }
        .project-filter__body__raisingfund__toggle {
          height: 20px;
          width: 36px;
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

        .project-fitlter__header__clear {
          display: none;
        }

        .project-filter__body {
          height: calc(100dvh - 130px);
          overflow: auto;
          padding: 0px 34px 10px 34px;
          flex-direction: column;
          display: flex;
          gap: 20px;
          padding-bottom: 50px;
        }

        .project-filter__body__raisingfund {
          padding-top: 16px;
          margin-top: 20px;
          display: flex;
          align-items: center;
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
          }
          .project-filter__body__raisingfund__title {
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #475569;
            padding: 0 14px 0 4px;
          }
        }
      `}</style>
    </>
  );
};

export default ProjectFilter;
