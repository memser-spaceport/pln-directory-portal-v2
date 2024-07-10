"use client";
import FilterCount from "../../ui/filter-count";
import Toggle from "../../ui/toggle";
import useUpdateQueryParams from "../../../hooks/useUpdateQueryParams";
import { getTeam, searchTeamsByName } from "../../../../../../services/teams.service";
import { CommonUtils } from "../../../../../../utils";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useProjectListAnalytics } from "../../../analytics/project-list-analytics";
import { Autocomplete, OptionsProps } from "../../ui/autocomplete";
import { IProjectFilter } from "../../../../../../types";
import useClickedOutside from "../../../hooks/useClickedOutside";

const ProjectFilterMobile = (props: IProjectFilter) => {
  //props
  const userInfo = props?.userInfo;

  //variables
  const { searchParams, updateQueryParams } = useUpdateQueryParams();
  const initialQuery = CommonUtils.getQuery(searchParams);
  const apliedFiltersCount = CommonUtils.getFilterCount(initialQuery);
  const appliedFiltersCount = 0;
  const isRaisingFund = searchParams?.get("funding") ?? false;
  const teamId = searchParams?.get("team") ?? "";
  const router = useRouter();
  const projectTeamRef = useRef<HTMLInputElement>(null);
  const projectPaneRef = useRef<HTMLDivElement>(null);
  const analytics = useProjectListAnalytics();

  //state
  const [searchResult, setSearchResult] = useState<OptionsProps[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedOption, setSelectedOption] = useState<OptionsProps>({ label: "", value: "", logo: "" });
  const [isTeamActive, setIsTeamActive] = useState(false);
  const [isFilter, setIsFilter] = useState(false);

  //methods
  useClickedOutside({ callback: () => setIsTeamActive(false), ref: projectPaneRef });
  
  const onClearAllClicked = () => {
    if (searchParams?.size) {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      const pathname = window?.location?.pathname;
      const clearQuery = ["team", "funding"];
      clearQuery.forEach((query) => {
        if (current.has(query)) {
          CommonUtils.triggerLoader(true);
          current.delete(query);
        }
      });
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.push(`${pathname}/${query}`);
      analytics.onClearAllClicked(CommonUtils.getAnalyticsUserInfo(userInfo));
    }
  };

  const onToggleClicked = () => {
    CommonUtils.triggerLoader(true);
    if (!isRaisingFund) {
      updateQueryParams("funding", "true");
      analytics.onFundingRequiredToggleClicked(CommonUtils.getAnalyticsUserInfo(userInfo), true);
    } else {
      updateQueryParams("funding", "");
      analytics.onFundingRequiredToggleClicked(CommonUtils.getAnalyticsUserInfo(userInfo), false);
    }
  };

  const onTeamSelected = (team: OptionsProps) => {
    setSelectedOption(team);
    if (team?.value) {
      updateQueryParams("team", team.value);
      analytics.onTeamSelected(CommonUtils.getAnalyticsUserInfo(userInfo), team);
    } else {
      updateQueryParams("team", "");
      analytics.onTeamSelected(CommonUtils.getAnalyticsUserInfo(userInfo), "");
    }
  };

  const onAutocompleteBlur = () => {
    setSearchText(selectedOption.label);
  }

  const findTeamsByName = async (searchTerm: string) => {
    setIsTeamActive(true);
    setSearchText(searchTerm);
    try {
      const results = await searchTeamsByName(searchTerm);
      setSearchResult(results);
    } catch (error) {
      console.error(error);
    }
  };

  const onTogglePane = (isActive: boolean) => {
    setIsTeamActive(isActive);
    if(isActive){
      findTeamsByName(searchText);
    }
  }

  useEffect(() => {
    if (teamId) {
      const getTeamDetail = async (teamId: string) => {
        const teamResponse = await getTeam(teamId, {
          with: "logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member",
        });
        if (teamResponse.error) {
          return;
        }
        const formattedTeam = teamResponse?.data?.formatedData;
        setSelectedOption({ label: formattedTeam?.name, value: formattedTeam?.id, logo: formattedTeam?.logo });
        setSearchText(formattedTeam?.name);
        setIsTeamActive(false);  
      };
      getTeamDetail(teamId ?? "");
    } else {
      setSelectedOption({ label: "", value: "", logo: "" });
      setSearchText("");
    }
  }, [teamId]);

  const onClose = () => {
    setIsFilter(!isFilter);
  };

  useEffect(() => {
    document.addEventListener(CommonUtils.EVENTS.SHOW_FILTER, onClose);
    document.removeEventListener(CommonUtils.EVENTS.SHOW_FILTER, () => {});
  }, []);

  const onApplyClicked = () => {
    setIsFilter(!isFilter);
  };
  return (
    <>
      {isFilter && (
        <div className="project-filter-mobile">
          {/* Header */}
          <div className="project-filter-mobile__header">
            <h2 className="project-filter-mobile__header__title">
              Filters
              {apliedFiltersCount > 0 && <FilterCount count={apliedFiltersCount} />}
            </h2>
            <button className="project-filter-mobile__header__closebtn" onClick={onClose}>
              <img alt="close" src="/icons/close.svg" height={16} width={16} />
            </button>
          </div>

          {/* Body */}
          <div className="project-filter-mobile__body">
            <div className="project-filter-mobile__body__raisingfund">
              <div className="project-filter-mobile__body__raisingfund__icon">
                <img src="/icons/raising-fund-indicator.svg" alt="fund-icon" />
                <h3 className="project-filter-mobile__body__raisingfund__title">Projects Raising Funds</h3>
              </div>
              <div className="project-filter-mobile__body__topic__select__toggle">
                <Toggle callback={onToggleClicked} isChecked={!!isRaisingFund} />
              </div>
            </div>
            <div className="project-filter-mobile__bl"></div>
            <label className="project-filter-mobile__body__maintainer">
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
            </label>
          </div>

          {/* Footer */}
          <div className="project-filter-mobile__footer">
            <button className="project-filter-mobile__footer__clrbtn" onClick={onClearAllClicked}>
              Clear All
            </button>
            <button className="project-filter-mobile__footer__aplybtn" onClick={onApplyClicked}>
              Apply
            </button>
          </div>
        </div>
      )}
      <style jsx>
        {`
          .project-filter-mobile {
            width: inherit;
            display: unset;
            position: fixed;
            border-right: 1px solid #e2e8f0;
            background: #fff;
            width: inherit;
            z-index: 5;
            top: 0;
            height: 100dvh;
          }

          .project-filter-mobile__header {
            display: flex;
            padding: 20px 24px;
            width: 100%;
            justify-content: space-between;
            border-bottom: 1px solid #cbd5e1;
          }

          .project-filter-mobile__body {
            margin-bottom: 50px;
            height: calc(100dvh - 130px);
            overflow: auto;
            padding: 0px 24px 10px 24px;
            flex-direction: column;
            display: flex;
          }

          .project-filter-mobile__header__title {
            color: #0f172a;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            gap: 8px;
            align-items: center;
            line-height: 20px;
          }

          .project-filter-mobile__body__maintainer {
            padding: 20px 0;
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .project-filter-mobile__header__closebtn {
            border: none;
            background-color: #fff;
          }

          .project-fitlter-mobile__header__clear-all-btn {
            display: none;
          }

          .project-filter-mobile__bl {
            width: 100%;
            height: 1px;
            border-top: 1px solid #cbd5e1;
          }

          .project-filter-mobile__body__topic__select__toggle {
            height: 20px;
            width: 36px;
          }

          .project-filter-mobile__body__raisingfund__title {
            color: #475569;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .project-filter-mobile__body__raisingfund {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 30px 0px;
            display: flex;
          }

          .project-filter-mobile__body__raisingfund__icon {
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .project-filter-mobile__footer {
            z-index: 4;
            position: absolute;
            bottom: 0;
            height: 60px;
            align-items: center;
            width: inherit;
            display: flex;
            gap: 4px;
            padding: 0px 24px;
            justify-content: space-between;
            background: #fff;
            box-shadow: 0px -2px 6px 0px rgba(15, 23, 42, 0.16);
          }

          .project-filter-mobile__footer__aplybtn {
            line-height: 20px;
            font-weight: 500;
            font-size: 14px;
            width: 50%;
            padding: 10px 24px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background: #156ff7;
            box-shadow: 0px 1px 1px 0px rgba(15, 23, 42, 0.08);
            color: #fff;
          }

          .project-filter-mobile__footer__clrbtn {
            line-height: 20px;
            font-weight: 500;
            font-size: 14px;
            padding: 10px 24px;
            width: 50%;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background: #fff;
            box-shadow: 0px 1px 1px 0px rgba(15, 23, 42, 0.08);
            color: #0f172a;
          }

          @media (min-width: 1024px) {
            .project-filter-mobile__footer {
              display: none;
            }

            .project-filter-mobile__header__closebtn {
              display: none;
            }

            .project-fitlter-mobile__header__clear-all-btn {
              display: unset;
              border: none;
              background: none;
              color: #156ff7;
              font-size: 13px;
              font-weight: 400;
              line-height: 20px;
            }
            .project-filter-mobile__body {
              margin-bottom: 50px;
              width: 100%;
              overflow-x: hidden;
              height: calc(100dvh - 140px);
            }
          }
        `}
      </style>

      <style global jsx>
        {`
          body {
            overflow: ${isFilter ? "hidden" : "unset"};
          }
        `}
      </style>
    </>
  );
};

export default ProjectFilterMobile;
