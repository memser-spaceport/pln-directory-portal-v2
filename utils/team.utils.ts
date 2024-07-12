import { ITag, ITeamListOptions, ITeamResponse, ITeamsSearchParams } from "@/types/teams.types";
import { getSortFromQuery, getUniqueFilterValues, stringifyQueryValues } from "./common.utils";
import { URL_QUERY_VALUE_SEPARATOR } from "./constants";

export function getTeamsOptionsFromQuery(queryParams: ITeamsSearchParams) {
  const { sort, tags, membershipSources, fundingStage, searchBy, technology, includeFriends, focusAreas, officeHoursOnly } = queryParams;
  const sortFromQuery = getSortFromQuery(sort?.toString());
  const sortField = sortFromQuery.field.toLowerCase();

  return {
    ...(officeHoursOnly ? { officeHours__not: 'null' } : {}),
    ...(technology ? { "technologies.title__with": stringifyQueryValues(technology) } : {}),
    ...(membershipSources ? { "membershipSources.title__with": stringifyQueryValues(membershipSources) } : {}),
    ...(fundingStage ? { "fundingStage.title__with": stringifyQueryValues(fundingStage) } : {}),
    ...(tags ? { "industryTags.title__with": stringifyQueryValues(tags) } : {}),
    ...(includeFriends ? {} : { plnFriend: false }),
    ...(searchBy ? { name__icontains: stringifyQueryValues(searchBy).trim() } : {}),
    ...(focusAreas ? { 'focusAreas': stringifyQueryValues(focusAreas) } : {}),
    orderBy: `${sortFromQuery.direction === "desc" ? "-" : ""}${sortField}`,
  };
}

export const parseTeamsFilters = (teams: ITeamResponse[]) => {
  const filtersValues = teams?.reduce(
    (values: { tags: string[], membershipSources: string[], fundingStage: string[], technology: string[] }, team: ITeamResponse) => {
      const tags = getUniqueFilterValues(
        values.tags,
        team.industryTags?.map((tag: ITag) => tag.title)
      );
      const membershipSources = getUniqueFilterValues(
        values.membershipSources,
        team.membershipSources?.map((source: ITag) => source.title)
      );
      const fundingStage = getUniqueFilterValues(values?.fundingStage, team?.fundingStage && [team?.fundingStage?.title]);
      const technology = getUniqueFilterValues(
        values.technology,
        team.technologies?.map((technology: { title: string }) => technology.title)
      );

      return { tags, membershipSources, fundingStage, technology };
    },
    {
      tags: [],
      membershipSources: [],
      fundingStage: [],
      technology: [],
    }
  );

  Object.values(filtersValues).forEach((value) => value.sort());
  return filtersValues;
};


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
  return { ...options, select: "uid,name,shortDescription,logo.url,industryTags.title", pagination: false };
}

export function transformTeamApiToFormObj(obj: any){
  const output = {
    ...obj.basicInfo,
    ...obj.projectsInfo,
    ...obj.socialInfo
  };

  output.fundingStage = {
    title: {...output}.fundingStage?.name,
    uid: {...output}.fundingStage?.id
  }

  output.membershipSources = {...output}.membershipSources?.map((v:any) => {
    return {
      title: v.name,
      uid: v.id
    }
  })

  output.technologies = {...output}.technologies?.map((v:any) => {
    return {
      title: v.name,
      uid: v.id
    }
  })
  output.industryTags = {...output}.industryTags?.map((v:any) => {
    return {
      title: v.name,
      uid: v.id
    }
  })
  
 delete output.teamProfile
 delete output.requestorEmail
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
    } 
    else if (key.startsWith('teamFocusAreas')) {
      const [focusArea, subKey] = key.split('-');
      const focusAreaIndexMatch = focusArea.match(/\d+$/);
      if (focusAreaIndexMatch) {
        const focusAreaIndex = focusAreaIndexMatch[0];
        if (!teamFocusAreas[focusAreaIndex]) {
          teamFocusAreas[focusAreaIndex] = {};
        }
        teamFocusAreas[focusAreaIndex][subKey] = obj[key];
      }
    } 
    
    else if (key.startsWith('industryTag')) {
      const [industryTag, subKey] = key.split('-');
      const industryTagIndexMatch = industryTag.match(/\d+$/);
      if (industryTagIndexMatch) {
        const industryTagIndex = industryTagIndexMatch[0];
        if (!industryTags[industryTagIndex]) {
          industryTags[industryTagIndex] = {};
        }
        industryTags[industryTagIndex][subKey] = obj[key];
      }
    } else {
      result[key] = obj[key];
    }
  }

  result.fundingStage = fundingStage;
  result.technologies = Object.values(technologies);
  result.membershipSources = Object.values(membershipSources);
  result.industryTags = Object.values(industryTags);
  result.teamFocusAreas = Object.values(teamFocusAreas);
  return result;
}


export const getTechnologyImage = (technology: string) => {
  if (technology === "Filecoin") {
    return "/icons/technology/filecoin.svg";
  } else if (technology === "IPFS") {
    return "/icons/technology/ipfs.svg";
  } else if (technology === "libp2p") {
    return "/icons/technology/libp2p.svg";
  } else if (technology === "IPLD") {
    return "/icons/technology/ipld.svg";
  } else if (technology === "drand") {
    return "/icons/technology/drand.svg";
  } else if (technology === "FVM") {
    return "/icons/technology/fvm.svg";
  } else if (technology === "SourceCred") {
    return "/icons/technology/sourcecred.svg";
  }
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
}