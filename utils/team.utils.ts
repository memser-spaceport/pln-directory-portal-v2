import map from 'lodash/map';
import reduce from 'lodash/reduce';
import isFunction from 'lodash/isFunction';
import { NextResponse } from 'next/server';
import { ITeamListOptions, ITeamsSearchParams } from '@/types/teams.types';
import { getSortFromQuery, stringifyQueryValues } from './common.utils';
import { URL_QUERY_VALUE_SEPARATOR } from './constants';
import { OptionWithTeams } from '@/app/teams/(teams-page)/teamsApi';

export function getTeamsOptionsFromQuery(queryParams: ITeamsSearchParams) {
  const {
    sort,
    tags,
    membershipSources,
    fundingStage,
    searchBy,
    technology,
    includeFriends,
    focusAreas,
    officeHoursOnly,
    isRecent,
    isHost,
    isSponsor,
    asks,
  } = queryParams;
  const sortFromQuery = getSortFromQuery(sort?.toString());
  const sortField = sortFromQuery.field.toLowerCase() + ',default';

  return {
    ...(officeHoursOnly ? { officeHours__not: 'null' } : {}),
    ...(technology ? { 'technologies.title__with': stringifyQueryValues(technology) } : {}),
    ...(membershipSources ? { 'membershipSources.title__with': stringifyQueryValues(membershipSources) } : {}),
    ...(fundingStage ? { 'fundingStage.title__with': stringifyQueryValues(fundingStage) } : {}),
    ...(tags ? { 'industryTags.title__with': stringifyQueryValues(tags) } : {}),
    ...(includeFriends ? {} : { plnFriend: false }),
    ...(searchBy ? { name__icontains: stringifyQueryValues(searchBy).trim() } : {}),
    ...(focusAreas ? { focusAreas: stringifyQueryValues(focusAreas) } : {}),
    ...(isRecent ? { isRecent: true } : {}),
    ...(isHost ? { isHost: true } : {}),
    ...(isSponsor ? { isSponsor: true } : {}),
    ...(asks ? { askTags: stringifyQueryValues(asks) } : {}),
    orderBy: `${sortFromQuery.direction === 'desc' ? '-' : ''}${sortField}`,
  };
}

type Input = {
  searchParams: ITeamsSearchParams;
  formattedValuesByFilter: any;
  formattedAvailableValuesByFilter: any;
  focusAreaData: any;
  membershipSourceData: OptionWithTeams[];
  industryTags: OptionWithTeams[];
  fundingStages: OptionWithTeams[];
};

export function processFilters(input: Input) {
  const { searchParams, formattedValuesByFilter, formattedAvailableValuesByFilter, focusAreaData } = input;

  const focusAreaQuery = searchParams?.focusAreas;
  const focusAreaFilters = focusAreaQuery?.split(URL_QUERY_VALUE_SEPARATOR) || [];
  const selectedFocusAreas =
    focusAreaFilters.length > 0
      ? focusAreaData?.filter((focusArea: any) => focusAreaFilters.includes(focusArea.title))
      : [];

  return {
    tags: formatIndustryTagFilterOptions(input),
    membershipSources: formatMembershipSourceFilterOptions(input),
    fundingStage: formatFundingStageFilterOptions(input),
    technology: getTagsFromValues(
      formattedValuesByFilter?.technology,
      formattedAvailableValuesByFilter?.technology,
      searchParams?.technology,
    ),
    focusAreas: {
      rawData: focusAreaData,
      selectedFocusAreas,
    },
    asks: getTagsFromValues(
      formattedValuesByFilter?.askTags,
      formattedAvailableValuesByFilter?.askTags,
      searchParams?.asks,
    ),
    tiers: getTiersFromValues(formattedValuesByFilter?.tiers, searchParams?.tiers),
  };
}

function formatFilterOptionsWithCounts(
  optionsData: OptionWithTeams[],
  formattedValues: string[],
  availableValues: string[],
  queryValues?: string | string[],
) {
  const formattedData = reduce(
    optionsData,
    (acc: Record<string, OptionWithTeams>, opt) => {
      acc[opt.title] = opt;
      return acc;
    },
    {},
  );

  const options = getTagsFromValues(formattedValues, availableValues, queryValues);

  const result = map(options, (opt) => ({
    ...opt,
    count: formattedData[opt.value]?.teams?.length || 0,
  }));

  return result;
}

function formatMembershipSourceFilterOptions(input: Input) {
  const { searchParams, formattedValuesByFilter, formattedAvailableValuesByFilter, membershipSourceData } = input;

  return formatFilterOptionsWithCounts(
    membershipSourceData,
    formattedValuesByFilter?.membershipSources,
    formattedAvailableValuesByFilter?.membershipSources,
    searchParams?.membershipSources,
  );
}

function formatIndustryTagFilterOptions(input: Input) {
  const { searchParams, formattedValuesByFilter, formattedAvailableValuesByFilter, industryTags } = input;

  return formatFilterOptionsWithCounts(
    industryTags,
    formattedValuesByFilter?.tags,
    formattedAvailableValuesByFilter?.tags,
    searchParams?.tags,
  );
}

function formatFundingStageFilterOptions(input: Input) {
  const { searchParams, formattedValuesByFilter, formattedAvailableValuesByFilter, fundingStages } = input;

  return formatFilterOptionsWithCounts(
    fundingStages,
    formattedValuesByFilter?.fundingStage,
    formattedAvailableValuesByFilter?.fundingStage,
    searchParams?.fundingStage,
  );
}

export function getTagsFromValues(allValues: string[], availableValues: string[], queryValues: string | string[] = []) {
  const queryValuesArr = Array.isArray(queryValues) ? queryValues : queryValues.split(URL_QUERY_VALUE_SEPARATOR);

  return allValues.map((value) => {
    const selected = queryValuesArr.includes(value);
    const available = availableValues.includes(value);
    const disabled = !selected && !available;

    return { value, selected, disabled };
  });
}

export function getTiersFromValues(allValues: { tier: string; count: number }[], queryValues: string | string[] = []) {
  const queryValuesArr = Array.isArray(queryValues) ? queryValues : queryValues.split(URL_QUERY_VALUE_SEPARATOR);
  return allValues?.map((value) => {
    const selected = queryValuesArr.includes(value.tier);

    return { value: value.tier, selected, disabled: false, count: value.count };
  });
}

// Helper function to parse currency string to number
const parseCurrencyToNumber = (currencyString: string): number => {
  // Remove all non-numeric characters except decimal point
  const numericString = currencyString.replace(/[^\d.]/g, '');

  // Convert to number
  const numericValue = parseFloat(numericString);

  // Return 0 if parsing failed
  return isNaN(numericValue) ? 0 : numericValue;
};

export function getTeamsListOptions(options: ITeamListOptions) {
  return { ...options, select: 'uid,name,shortDescription,logo.url,industryTags.title,asks', pagination: true };
}

export function transformTeamApiToFormObj(obj: any) {
  const output = {
    ...obj.basicInfo,
    ...obj.projectsInfo,
    ...obj.socialInfo,
    ...obj.memberInfo,
  };

  output.fundingStage = {
    title: { ...output }.fundingStage?.name,
    uid: { ...output }.fundingStage?.id,
  };

  output.membershipSources = { ...output }.membershipSources?.map((v: any) => {
    return {
      title: v.name,
      uid: v.id,
    };
  });

  output.technologies = { ...output }.technologies?.map((v: any) => {
    return {
      title: v.name,
      uid: v.id,
    };
  });
  output.industryTags = { ...output }.industryTags?.map((v: any) => {
    return {
      title: v.name,
      uid: v.id,
    };
  });

  delete output.teamProfile;
  delete output.requestorEmail;
  return output;
}

export function transformRawInputsToFormObj(obj: any) {
  const result: any = {};
  const fundingStage: any = {};
  const technologies: any = {};
  const membershipSources: any = {};
  const industryTags: any = {};
  const teamFocusAreas: any = {};

  for (const key in obj) {
    if (key.startsWith('fundingStage')) {
      const subKey = key.split('-')[1];
      fundingStage[subKey] = obj[key];
    } else if (key.startsWith('technology')) {
      const [technology, subKey] = key.split('-');
      const technologyIndexMatch = technology?.match(/\d+$/);
      if (technologyIndexMatch) {
        const technologyIndex = technologyIndexMatch[0];
        if (!technologies[technologyIndex]) {
          technologies[technologyIndex] = {};
        }
        technologies[technologyIndex][subKey] = obj[key];
      }
    } else if (key.startsWith('membershipSource')) {
      const [membershipSource, subKey] = key.split('-');
      const membershipSourceIndexMatch = membershipSource.match(/\d+$/);
      if (membershipSourceIndexMatch) {
        const membershipSourceIndex = membershipSourceIndexMatch[0];
        if (!membershipSources[membershipSourceIndex]) {
          membershipSources[membershipSourceIndex] = {};
        }
        membershipSources[membershipSourceIndex][subKey] = obj[key];
      }
    } else if (key.startsWith('teamFocusAreas')) {
      const [focusArea, subKey] = key.split('-');
      const focusAreaIndexMatch = focusArea.match(/\d+$/);
      if (focusAreaIndexMatch) {
        const focusAreaIndex = focusAreaIndexMatch[0];
        if (!teamFocusAreas[focusAreaIndex]) {
          teamFocusAreas[focusAreaIndex] = {};
        }
        teamFocusAreas[focusAreaIndex][subKey] = obj[key];
      }
    } else if (key.startsWith('industryTag')) {
      const [industryTag, subKey] = key.split('-');
      const industryTagIndexMatch = industryTag.match(/\d+$/);
      if (industryTagIndexMatch) {
        const industryTagIndex = industryTagIndexMatch[0];
        if (!industryTags[industryTagIndex]) {
          industryTags[industryTagIndex] = {};
        }
        industryTags[industryTagIndex][subKey] = obj[key];
      }
    } else if (key.startsWith('rich-text-editor')) {
      result['longDescription'] = obj[key];
    } else if (key.startsWith('name')) {
      result['name'] = obj[key].trim();
    } else if (key.startsWith('investmentFocus')) {
      if (result.investorProfile) {
        result.investorProfile.investmentFocus = obj[key] ? JSON.parse(obj[key]) : [];
      } else {
        result.investorProfile = {
          investmentFocus: obj[key] ? JSON.parse(obj[key]) : [],
        };
      }
    } else if (key.startsWith('typicalCheckSize')) {
      if (result.investorProfile) {
        result.investorProfile.typicalCheckSize = parseCurrencyToNumber(obj[key]);
      } else {
        result.investorProfile = {
          typicalCheckSize: parseCurrencyToNumber(obj[key]),
        };
      }
    } else if (key.startsWith('isFund')) {
      result.isFund = obj[key] === 'on';
    } else if (key.startsWith('investInFundTypes')) {
      if (result.investorProfile) {
        result.investorProfile.investInFundTypes = obj[key]
          ? (JSON.parse(obj[key])?.map((item: any) => item.label) ?? [])
          : [];
      } else {
        result.investorProfile = {
          investInFundTypes: obj[key] ? (JSON.parse(obj[key])?.map((item: any) => item.label) ?? []) : [],
        };
      }
    } else if (key.startsWith('investInStartupStages')) {
      if (result.investorProfile) {
        result.investorProfile.investInStartupStages = obj[key]
          ? (JSON.parse(obj[key])?.map((item: any) => item.label) ?? [])
          : [];
      } else {
        result.investorProfile = {
          investInStartupStages: obj[key] ? (JSON.parse(obj[key])?.map((item: any) => item.label) ?? []) : [],
        };
      }
    } else {
      result[key] = obj[key];
    }
  }

  result['plnFriend'] = result.plnFriend === 'on' ? true : false;
  result.fundingStage = fundingStage;
  result.technologies = Object.values(technologies);
  result.membershipSources = Object.values(membershipSources);
  result.industryTags = Object.values(industryTags);
  result.teamFocusAreas = Object.values(teamFocusAreas);
  return result;
}

export const getTechnologyImage = (technology: string) => {
  if (technology === 'Filecoin') {
    return '/icons/technology/filecoin.svg';
  } else if (technology === 'IPFS') {
    return '/icons/technology/ipfs.svg';
  } else if (technology === 'libp2p') {
    return '/icons/technology/libp2p.svg';
  } else if (technology === 'IPLD') {
    return '/icons/technology/ipld.svg';
  } else if (technology === 'drand') {
    return '/icons/technology/drand.svg';
  } else if (technology === 'FVM') {
    return '/icons/technology/fvm.svg';
  } else if (technology === 'SourceCred') {
    return '/icons/technology/sourcecred.svg';
  }
};

export const getTeamInitialValue = (selectedTeam: any, membersDetail: any) => {
  return {
    basicInfo: {
      requestorEmail: '',
      imageFile: selectedTeam.imageFile ?? '',
      name: selectedTeam.name ?? '',
      shortDescription: selectedTeam.shortDescription ?? '',
      longDescription: selectedTeam.longDescription ?? '',
      officeHours: selectedTeam.officeHours ?? '',
      plnFriend: selectedTeam.plnFriend ?? false,
      isFund: selectedTeam?.isFund ?? false,
      investorProfile: {
        investmentFocus: selectedTeam.investorProfile?.investmentFocus ?? [],
        typicalCheckSize: selectedTeam.investorProfile?.typicalCheckSize ?? '',
        investInStartupStages: selectedTeam.investorProfile?.investInStartupStages ?? [],
        investInFundTypes: selectedTeam.investorProfile?.investInFundTypes ?? [],
      },
    },
    projectsInfo: {
      technologies: selectedTeam.technologies ?? [],
      membershipSources: selectedTeam.membershipSources ?? [],
      industryTags: selectedTeam.industryTags ?? [],
      fundingStage: {
        id: selectedTeam.fundingStageUid,
        name: selectedTeam?.fundingStage?.title,
      },
      teamFocusAreas: selectedTeam?.teamFocusAreas ?? [],
    },
    socialInfo: {
      contactMethod: selectedTeam?.contactMethod ?? '',
      website: selectedTeam?.website ?? '',
      linkedinHandler: selectedTeam?.linkedinHandler ?? '',
      twitterHandler: selectedTeam?.twitterHandler ?? '',
      telegramHandler: selectedTeam?.telegramHandler ?? '',
      blog: selectedTeam?.blog ?? '',
    },
    memberInfo: {
      teamMemberRoles: membersDetail,
    },
  };
};

export const teamRegisterDefault = {
  basicInfo: {
    requestorEmail: '',
    teamProfile: '',
    name: '',
    shortDescription: '',
    longDescription: '',
    officeHoures: '',
  },
  projectsInfo: {
    technologies: [],
    membershipSources: [],
    industryTags: [],
    fundingStage: { id: '', name: '' },
  },
  socialInfo: {
    contactMethod: '',
    website: '',
    linkedinHandler: '',
    twitterHandler: '',
    telegramHandler: '',
    blog: '',
  },
};

export function getFormattedDateString(startDate: string, endDate: string) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  try {
    const [startDateOnly] = startDate.split('T');
    const [endDateOnly] = endDate.split('T');

    const [startYear, startMonth] = startDateOnly.split('-');
    const [endYear, endMonth] = endDateOnly.split('-');

    const startMonthName = monthNames[parseInt(startMonth, 10) - 1];
    const endMonthName = monthNames[parseInt(endMonth, 10) - 1];

    const formattedStartYear = startYear.slice(2);
    const formattedEndYear = endYear.slice(2);

    if (startDateOnly === endDateOnly) {
      return `${startMonthName} ${formattedStartYear}`;
    } else if (startMonth === endMonth && startYear === endYear) {
      return `${startMonthName} ${formattedStartYear}`;
    } else if (startYear === endYear) {
      return `${startMonthName} - ${endMonthName} ${formattedStartYear}`;
    } else {
      return `${startMonthName} ${formattedStartYear} - ${endMonthName} ${formattedEndYear}`;
    }
  } catch {
    return '';
  }
}

export function getTierColor(tier: number): string {
  const tierColors: Record<number, string> = {
    0: '#d9d2e9',
    1: '#fce5cd',
    2: '#ead1dc',
    3: '#d9ead3',
    4: '#d9d2e9',
  };

  return tierColors[tier] || '#d9d2e9'; // Default to tier 0/4 color if tier not found
}

export function getTierLabel(tier: number | string): string {
  const tierLabels: Record<string, string> = {
    '0': 'Tier 0',
    '1': 'Tier 1',
    '2': 'Tier 2',
    '3': 'Tier 3',
    '4': 'Tier 4',
    '-1': 'Tier N/A',
  };

  return tierLabels[String(tier)] || 'Tier ?';
}

export function getTeamTier(team: { tier?: number | string | null }): number | string | undefined {
  return typeof team?.tier === 'number' && team?.tier <= 4 ? team?.tier : undefined;
}

export function parseFocusAreasParams(queryParams: any) {
  const modifiedParams = { ...queryParams };

  if (modifiedParams?.asks) {
    modifiedParams.askTags = modifiedParams.asks;
    delete modifiedParams.asks;
  }

  if (modifiedParams.askTags) {
    modifiedParams.askTags = modifiedParams.askTags.replace(/\|/g, ',');
  }

  return modifiedParams;
}

/**
 * Creates a generic GET route handler for team filter endpoints
 *
 * This factory function reduces boilerplate by extracting common logic from routes like:
 * - /api/teams/focus-areas
 * - /api/teams/membership-source
 * - /api/teams/tags
 *
 * @param options Configuration options for the route handler
 * @param options.serviceFn - The service function to call (e.g., getFocusAreas, getMembershipSource)
 * @param options.entityType - The entity type to pass to the service function (e.g., 'Team', 'Project')
 * @param options.errorMessage - Custom error message for failures
 * @param options.parseParams - Optional custom param parser
 * @returns Next.js route handler function
 *
 * @example
 * ```typescript
 * export const GET = getTeamFilterRouterWithOptionCounters({
 *   serviceFn: getFocusAreas,
 *   entityType: 'Team',
 *   errorMessage: 'Failed to fetch focus areas',
 * });
 * ```
 */
export function getTeamFilterRouterWithOptionCounters(options: {
  serviceFn: (type: string, params: any) => Promise<{ data?: any; error?: any }>;
  entityType: string;
  errorMessage: string;
  parseParams?: (params: any) => any;
}) {
  const { serviceFn, entityType, errorMessage, parseParams } = options;

  return async function GET(request: any) {
    try {
      const searchParams = request.nextUrl.searchParams;
      let paramsObj = Object.fromEntries(searchParams.entries());

      // Parse and fetch data using the provided service function
      if (isFunction(parseParams)) {
        paramsObj = parseParams(paramsObj);
      }

      const result = await serviceFn(entityType, paramsObj);

      if (result?.error) {
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }

      return NextResponse.json({
        data: result?.data || [],
      });
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
