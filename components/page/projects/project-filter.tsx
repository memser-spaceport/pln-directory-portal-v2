'use client';

import useUpdateQueryParams from '../../../hooks/useUpdateQueryParams';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import useClickedOutside from '../../../hooks/useClickedOutside';
import { getAnalyticsUserInfo, getFilterCount, getQuery, triggerLoader } from '@/utils/common.utils';
import Toggle from '@/components/ui/toogle';
import { Autocomplete } from '@/components/ui/autocomplete';
import { searchTeamsByName } from '@/services/teams.service';
import { DEFAULT_PROJECT_TAGS, EVENTS, FOCUS_AREAS_FILTER_KEYS, PAGE_ROUTES } from '@/utils/constants';
import { FocusAreaFilter } from '@/components/core/FocusAreaFilter';
import { useDebounce } from '@/hooks/useDebounce';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import TagContainer from '@/components/ui/tag-container';
import { FiltersSearch } from '@/components/page/projects/FiltersSearch';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import s from './project-filter.module.scss';

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

  const tagsFilters = DEFAULT_PROJECT_TAGS.map((tag) => {
    return {
      value: tag.label,
      selected: searchParams['tags']?.split(',').includes(tag.label) ?? false,
      disabled: !props?.filters?.tags?.some((filterTag: any) => filterTag.value === tag.label),
    };
  });

  //state
  const [searchResult, setSearchResult] = useState<any[]>(props?.initialTeams ?? []);
  const selectedTeam = props?.selectedTeam;
  const [searchText, setSearchText] = useState(selectedTeam?.label);
  const [isTeamActive, setIsTeamActive] = useState(false);
  const debouncedSearchText = useDebounce(searchText, 300);

  //methods
  useClickedOutside({ callback: () => setIsTeamActive(false), ref: projectPaneRef });

  const onShowClickHandler = () => {
    analytics.onProjectShowFilterResultClicked(getAnalyticsUserInfo(userInfo));
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_PROJECTS_FILTER, { detail: false }));
  };

  const onClearAllClicked = () => {
    if (apliedFiltersCount > 0) {
      setSearchText('');
      const current = new URLSearchParams(Object.entries(searchParams));
      const pathname = window?.location?.pathname;
      const clearQuery = ['team', 'funding', 'focusAreas', 'isRecent', 'tags', 'searchBy'];
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
      router.refresh();
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

    if (team.value !== searchParams['team']) {
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
    updateQueryParams('team', '', searchParams);
    findTeamsByName('');
  };

  const onTagClickHandler = (key: string, value: string, isSelected: boolean) => {
    triggerLoader(true);
    const tags = searchParams['tags'] ? searchParams['tags'].split(',') : [];
    if (!isSelected) {
      tags.push(value);
    } else {
      const index = tags.indexOf(value);
      if (index > -1) {
        tags.splice(index, 1);
      }
    }

    if (tags.length === 0) {
      updateQueryParams('tags', '', searchParams);
    } else {
      updateQueryParams('tags', tags, searchParams);
    }
    analytics.onProjectFilterApplied(getAnalyticsUserInfo(userInfo), {
      tags: tags,
    });
  };

  useEffect(() => {
    setSearchText(selectedTeam?.label);
  }, [router, searchParams]);

  return (
    <FiltersSidePanel
      onClose={onShowClickHandler}
      clearParams={onClearAllClicked}
      appliedFiltersCount={apliedFiltersCount}
      bodyClassName={s.body}
      applyLabel="View"
    >
      <FiltersSearch searchParams={searchParams} userInfo={userInfo} />
      <div className={s.raisingFund}>
        <div className={s.raisingFundWrapper}>
          <h3 className={s.raisingFundTitle}>New Projects</h3>
        </div>
        <div>
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
      <div className={s.divider}></div>
      <div className={s.raisingFund}>
        <div className={s.raisingFundWrapper}>
          <img src="/icons/raising-fund-indicator.svg" alt="fund-icon" />
          <h3 className={s.raisingFundTitle}>Projects Raising Funds</h3>
        </div>
        <div>
          <Toggle height="16px" width="28px" callback={onToggleClicked} isChecked={!!isRaisingFund} />
        </div>
      </div>
      <div className={s.divider}></div>
      <div className={s.maintainer}>
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
          isClear={searchText || selectedTeam?.logo ? true : false}
        />
      </div>
      <div>
        <TagContainer
          page={PAGE_ROUTES.PROJECTS}
          label="Tags"
          isUserLoggedIn={userInfo}
          name="tags"
          items={tagsFilters ?? []}
          onTagClickHandler={onTagClickHandler}
          initialCount={10}
          userInfo={userInfo}
        />
      </div>
    </FiltersSidePanel>
  );
};

export default ProjectFilter;
