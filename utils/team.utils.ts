import { ITag, ITeamListOptions, ITeamResponse, ITeamsSearchParams } from '@/types/teams.types';
import { getSortFromQuery, getUniqueFilterValues, stringifyQueryValues } from './common.utils';
import { URL_QUERY_VALUE_SEPARATOR } from './constants';

export function getTeamsOptionsFromQuery(queryParams: ITeamsSearchParams) {
  const { sort, tags, membershipSources, fundingStage, searchBy, technology, includeFriends, focusAreas, officeHoursOnly, isRecent, isHost, isSponsor, asks } = queryParams;
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

export function processFilters(searchParams: ITeamsSearchParams, formattedValuesByFilter: any, formattedAvailableValuesByFilter: any, focusAreaData: any) {
  const focusAreaQuery = searchParams?.focusAreas;
  const focusAreaFilters = focusAreaQuery?.split(URL_QUERY_VALUE_SEPARATOR) || [];
  const selectedFocusAreas = focusAreaFilters.length > 0 ? focusAreaData?.filter((focusArea: any) => focusAreaFilters.includes(focusArea.title)) : [];

  return {
    tags: getTagsFromValues(formattedValuesByFilter?.tags, formattedAvailableValuesByFilter?.tags, searchParams?.tags),
    membershipSources: getTagsFromValues(formattedValuesByFilter?.membershipSources, formattedAvailableValuesByFilter?.membershipSources, searchParams?.membershipSources),
    fundingStage: getTagsFromValues(formattedValuesByFilter?.fundingStage, formattedAvailableValuesByFilter?.fundingStage, searchParams?.fundingStage),
    technology: getTagsFromValues(formattedValuesByFilter?.technology, formattedAvailableValuesByFilter?.technology, searchParams?.technology),
    focusAreas: {
      rawData: focusAreaData,
      selectedFocusAreas,
    },
    asks: getTagsFromValues(formattedValuesByFilter?.askTags, formattedAvailableValuesByFilter?.askTags, searchParams?.asks),
  };
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
        result.investorProfile.typicalCheckSize = obj[key];
      } else {
        result.investorProfile = {
          typicalCheckSize: obj[key],
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
