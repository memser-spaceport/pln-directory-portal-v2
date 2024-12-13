import { IMember, IMemberListOptions, IMemberPreferences, IMemberResponse, IMembersSearchParams, ITeamMemberRole } from '@/types/members.types';
import { getSortFromQuery, getUniqueFilterValues, stringifyQueryValues } from './common.utils';
import { URL_QUERY_VALUE_SEPARATOR } from './constants';
import { TeamAndSkillsInfoSchema, basicInfoSchema, projectContributionSchema } from '@/schema/member-forms';
import { validatePariticipantsEmail } from '@/services/participants-request.service';
import { validateLocation } from '@/services/location.service';


export const getFormattedFilters = (searchParams: IMembersSearchParams, rawFilters: any, availableFilters: any, isLoggedIn: boolean) => {
  const restricedKeys = ['region', 'country', 'metroArea'];
  const formattedFilters: any = {
    memberRoles: [],
    skills: rawFilters.skills,
    region: rawFilters.regions,
    country: rawFilters.countries,
    metroArea: rawFilters.cities,
  };

  const formattedAvailableFilters = {
    skills: availableFilters.skills,
    region: availableFilters.regions,
    country: availableFilters.countries,
    metroArea: availableFilters.cities,
    memberRoles: []
  }

   Object.keys(formattedFilters).forEach((key: string) => {
     const values = formattedFilters[key];
     formattedFilters[key] = values.map((value: string) => {
      const isAvailable = formattedAvailableFilters[key as keyof typeof formattedAvailableFilters].includes(value);
      const isRestricted = !isLoggedIn && restricedKeys.includes(key);
      return {
        value: value,
        selected:  searchParams[key as keyof IMembersSearchParams] ? searchParams[key as keyof IMembersSearchParams]?.split('|')?.includes(value) : false,
        disabled:  !isAvailable ? true: isRestricted  //isLoggedIn ? formattedAvailableFilters[key as keyof typeof formattedAvailableFilters].includes(value) ? false : true : restricedKeys.includes(key)
      }
     })
   })

   formattedFilters.isIncludeFriends = searchParams['includeFriends'] === 'true' || false;
   formattedFilters.isRecent = searchParams['isRecent'] === 'true' || false;
   formattedFilters.isOpenToWork = searchParams['openToWork'] === 'true' || false;
   formattedFilters.isOfficeHoursOnly = searchParams['officeHoursOnly'] === 'true' || false;
  

   return formattedFilters;
}

export const parseMemberDetails = (members: IMemberResponse[], teamId: string, isLoggedIn: boolean) => {
  return members?.map((member: IMemberResponse): IMember => {
    let parsedMember = { ...member };
    if (teamId) {
      parsedMember = {
        ...member,
        teamMemberRoles: member.teamMemberRoles?.filter((teamMemberRole: ITeamMemberRole) => teamMemberRole.team?.uid === teamId),
      };
    }
    const teams =
      parsedMember.teamMemberRoles?.map((teamMemberRole: ITeamMemberRole) => ({
        id: teamMemberRole.team?.uid || '',
        name: teamMemberRole.team?.name || '',
        role: teamMemberRole.role || 'Contributor',
        teamLead: !!teamMemberRole.teamLead,
        mainTeam: !!teamMemberRole.mainTeam,
      })) || [];
    const mainTeam = teams.find((team) => team.mainTeam);
    const teamLead = teams.some((team) => team.teamLead);

    const data: any = {
      id: parsedMember.uid,
      name: parsedMember.name,
      profile: parsedMember.image?.url || null,
      officeHours: parsedMember.officeHours || null,
      skills: parsedMember.skills || [],
      teamLead,
      // projectContributions: parsedMember.projectContributions ?? null,
      teams,
      location: parsedMember?.location,
      mainTeam,
      openToWork: parsedMember.openToWork || false,
      // preferences: parsedMember.preferences ?? null,
    };

    if (!isLoggedIn) {
      return {
        ...data,
        email: null,
        githubHandle: null,
        discordHandle: null,
        telegramHandle: null,
        twitter: null,
        linkedinHandle: null,
        repositories: [],
      };
    }
    return data;
  });
};

export const hidePreferences = (preferences: IMemberPreferences, member: IMember) => {
  if (!preferences?.showEmail) {
    delete member['email'];
  }
  if (!preferences?.showDiscord) {
    delete member['discordHandle'];
  }
  if (!preferences?.showGithubHandle) {
    delete member['githubHandle'];
  }
  if (!preferences?.showTelegram) {
    delete member['telegramHandle'];
  }
  if (!preferences?.showLinkedin) {
    delete member['linkedinHandle'];
  }
  if (!preferences?.showGithubProjects) {
    delete member['repositories'];
  }
  if (!preferences?.showTwitter) {
    delete member['twitter'];
  }
};

export const parseMemberLocation = (location: any) => {
  const { metroArea, city, country, region } = location ?? {};
  if (metroArea) {
    return metroArea;
  }
  if (country) {
    if (city) {
      return `${city}, ${country}`;
    }
    if (region) {
      return `${region}, ${country}`;
    }
    return country;
  }

  return 'Not provided';
};

export const formatDate = (dateString: string) => {
  const month = new Date(dateString).toLocaleDateString(undefined, { month: 'short' });
  const year = new Date(dateString).getFullYear();
  return `${month} ${year}`;
};

export const dateDifference = (date1: any, date2: any) => {
  const timeDifference = Math.abs(date1 - date2);
  const monthsBetween = (date1: any, date2: any) => {
    return (date2.getFullYear() - date1.getFullYear()) * 12 + date2.getMonth() - date1.getMonth();
  };

  const secondsDifference = Math.floor(timeDifference / 1000);
  const minutesDifference = Math.floor(secondsDifference / 60);
  const hoursDifference = Math.floor(minutesDifference / 60);
  const daysDifference = Math.floor(hoursDifference / 24);
  const monthsDifference = monthsBetween(date1, date2);
  const yearsDifference = Math.floor(monthsDifference / 12);

  if (yearsDifference >= 1) {
    if (monthsDifference % 12 !== 0) {
      return `${yearsDifference} years and ${monthsDifference % 12} months`;
    } else if (yearsDifference === 1) {
      return `${yearsDifference} year`;
    } else {
      return `${yearsDifference} years`;
    }
  } else if (monthsDifference === 1) {
    return `${monthsDifference} month`;
  } else if (monthsDifference > 1) {
    return `${monthsDifference} months`;
  } else if (daysDifference === 1) {
    return `${daysDifference} day`;
  } else if (daysDifference > 1) {
    return `${daysDifference} days`;
  } else if (hoursDifference >= 1) {
    return `${hoursDifference} hours`;
  } else if (minutesDifference >= 1) {
    return `${minutesDifference} minutes`;
  } else {
    return `${secondsDifference} seconds`;
  }
};

export function getMembersOptionsFromQuery(queryParams: IMembersSearchParams): IMemberListOptions {
  const { sort, searchBy, skills, region, country, metroArea, officeHoursOnly, includeFriends, openToWork, memberRoles, isRecent, includeUnVerified } = queryParams;

  const sortFromQuery = getSortFromQuery(sort?.toString());
  const sortField = sortFromQuery.field.toLowerCase();

  return {
    ...(officeHoursOnly ? { officeHours__not: 'null' } : {}),
    ...(skills ? { 'skills.title__with': stringifyQueryValues(skills) } : {}),
    ...(region
      ? {
          'location.continent__with': stringifyQueryValues(region),
        }
      : {}),
    ...(country ? { 'location.country__with': stringifyQueryValues(country) } : {}),
    ...(metroArea ? { 'location.city__with': stringifyQueryValues(metroArea) } : {}),
    ...(includeFriends ? {isVerified: 'all'} : { plnFriend: false, isVerified: 'true' }),
    ...(openToWork ? { openToWork: true } : {}),
    ...(isRecent ? { isRecent: true } : {}),
    ...(searchBy ? { name__icontains: stringifyQueryValues(searchBy).trim() } : {}),
    ...(memberRoles ? { memberRoles: stringifyQueryValues(memberRoles) } : {}),
   /*  ...(includeUnVerified ? { isVerified: 'all' } : {}), */
    orderBy: `${sortFromQuery.direction === 'desc' ? '-' : ''}${sortField}`,
  };
}

export function getMembersListOptions(options: IMemberListOptions) {
  return {
    ...options,
    pagination: true,
    select:
      'uid,name,openToWork,isRecent,isVerified,image.url,location.metroArea,location.country,location.region,location.city,skills.title,teamMemberRoles.teamLead,teamMemberRoles.mainTeam,teamMemberRoles.role,teamMemberRoles.team.name,teamMemberRoles.team.uid',
  };
}

export const getUniqueFilters = (members: IMemberResponse[]) => {
  const filtersValues = members.reduce(
    (values: any, member) => {
      const skills = getUniqueFilterValues(
        values?.skills,
        member?.skills?.map((skill: { title: string }) => skill.title)
      );

      const region = getUniqueFilterValues(values?.region, member?.location?.continent ? [member?.location?.continent] : []);

      const country = getUniqueFilterValues(values?.country, member?.location?.country ? [member?.location?.country] : []);

      const metroArea = getUniqueFilterValues(values.metroArea, member?.location?.city ? [member?.location?.city] : []);

      return { skills, region, country, metroArea };
    },
    {
      skills: [],
      region: [],
      country: [],
      metroArea: [],
    }
  );

  Object.values(filtersValues).forEach((value: any) => value?.sort());

  return filtersValues;
};

export function getTagsFromValues(allValues: string[], availableValues: string[], queryValues: string | string[] = [], isUserLoggedIn: boolean) {
  const queryValuesArr = Array.isArray(queryValues) ? queryValues : queryValues.split(URL_QUERY_VALUE_SEPARATOR);
  return allValues?.map((value) => {
    const selected = isUserLoggedIn ? queryValuesArr.includes(value) : false;
    const available = availableValues.includes(value);
    const isLoggedIn = isUserLoggedIn ? !selected && !available : true;
    const disabled = isLoggedIn;
    return { value, selected, disabled };
  });
}

export function getRoleTagsFromValues(allValues: any[], queryValues: string | string[] = []): any {
  const queryValuesArr = Array.isArray(queryValues) ? queryValues : queryValues.split(URL_QUERY_VALUE_SEPARATOR);

  const newValues = allValues?.map((item) => {
    const role = item.role;
    const selected = queryValuesArr.includes(item.role);
    return { role, selected, default: item.default ?? false, alias: item.alias ?? null, count: item.count };
  });

  return newValues.filter((item) => item?.selected || item?.default);
}

export const parseMemberFilters = (filtersValues: any, query: any, isUserLoggedIn: boolean, roleValues: any[]) => {
  const { parsedValuesByFilter, parsedAvailableValuesByFilter } = filtersValues;

  const formattedData = {
    skills: getTagsFromValues(parsedValuesByFilter.skills, parsedAvailableValuesByFilter.skills, query?.skills, true),
    region: getTagsFromValues(parsedValuesByFilter.region, parsedAvailableValuesByFilter.region, query?.region, isUserLoggedIn),
    country: getTagsFromValues(parsedValuesByFilter.country, parsedAvailableValuesByFilter.country, query?.country, isUserLoggedIn),
    metroArea: getTagsFromValues(parsedValuesByFilter.metroArea, parsedAvailableValuesByFilter.metroArea, query?.metroArea, isUserLoggedIn),
    memberRoles: getRoleTagsFromValues(roleValues, query.memberRoles),
  };

  return { data: { formattedData } };
};

export const getMemberInfoFormValues = async () => {
  const [teamsInfo, projectsInfo, skillsInfo] = await Promise.all([
    fetch(`${process.env.DIRECTORY_API_URL}/v1/teams?pagination=false`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/projects?pagination=false&select=name,uid,logo.url`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/skills?pagination=false`, { method: 'GET' }),
  ]);
  if (!teamsInfo.ok || !projectsInfo.ok || !skillsInfo.ok) {
    return { isError: true };
  }

  const teamsData = await teamsInfo.json();
  const projectsData = await projectsInfo.json();
  const skillsData = await skillsInfo.json();
  return {
    teams: teamsData
      ?.teams?.map((d: any) => {
        return {
          teamUid: d.uid,
          teamTitle: d.name,
          role: '',
        };
      })
      .sort((a: any, b: any) => a.teamTitle - b.teamTitle),
    skills: skillsData
      .map((d: any) => {
        return {
          id: d.uid,
          name: d.title,
        };
      })
      .sort((a: any, b: any) => a.name - b.name),
    projects: projectsData?.projects
      ?.map((d: any) => {
        return {
          projectUid: d.uid,
          projectName: d.name,
          projectLogo: d.logo?.url ?? '/icons/default-project.svg',
        };
      })
      .sort((a: any, b: any) => a.projectName - b.projectName),
  };
};

export function compareObjects(obj1: any, obj2: any) {
  if (obj1 === obj2) {
    return true; // Handles identical values and reference equality for objects and arrays
  }

  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false; // Handles primitive types and null
  }

  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    return false; // One is an array and the other is not
  }

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) {
      return false; // Different array lengths
    }
    for (let i = 0; i < obj1.length; i++) {
      if (!compareObjects(obj1[i], obj2[i])) {
        return false; // Different array elements
      }
    }
    return true;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false; // Different number of properties
  }

  for (let key of keys1) {
    if (!keys2.includes(key) || !compareObjects(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

export function utcDateToDateFieldString(isoString: string) {
  const date = new Date(isoString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function apiObjsToMemberObj(obj: any) {
  const formatted = {
    ...obj.basicInfo,
    ...obj.socialInfo,
    projectContributions: [...obj.contributionInfo].map((c) => {
      const endDateMonth = new Date(c.endDate).getMonth();
      const endDateYear = new Date(c.endDate).getFullYear();
      return {
        projectUid: c.projectUid,
        role: c.role,
        startDate: c.startDate,
        description: c.description,
        currentProject: c.currentProject,
        ...(c.currentProject === false && { endDate: new Date(Date.UTC(endDateYear, endDateMonth + 1, 0)).toISOString() }),
      };
    }),
    skills: obj.skillsInfo.skills.map((sk: any) => {
      return {
        title: sk.name,
        uid: sk.id,
      };
    }),
    teamOrProjectURL:obj?.skillsInfo?.teamOrProjectURL,
    teamAndRoles: obj.skillsInfo.teamsAndRoles,
    openToWork: obj?.skillsInfo?.openToWork ?? false
  };

  if (!formatted.imageFile) {
    formatted.imageFile = '';
  }

  if (formatted.plnStartDate) {
    formatted['plnStartDate'] = new Date(formatted['plnStartDate']).toISOString();
  }

  return formatted;
}

export function formInputsToMemberObj(obj: any) {
  const result: any = {};
  const teamAndRoles: any = {};
  const projectContributions: any = {};
  const skills: any = {};

  for (const key in obj) {
    if (key.startsWith('teamInfo')) {
      const [teamInfo, subKey] = key.split('-');
      const teamIndexMatch = teamInfo.match(/\d+$/);

      if (teamIndexMatch) {
        const teamIndex = teamIndexMatch[0];
        if (!teamAndRoles[teamIndex]) {
          teamAndRoles[teamIndex] = {};
        }
        teamAndRoles[teamIndex][subKey] = obj[key];
      }
    } else if (key.startsWith('contributionInfo')) {
      const [contributionInfo, subKey] = key.split('-');
      const contributionIndexMatch = contributionInfo.match(/\d+$/);
      if (contributionIndexMatch) {
        const contributionIndex = contributionIndexMatch[0];

        if (!projectContributions[contributionIndex]) {
          projectContributions[contributionIndex] = {};
        }
        if (subKey === 'currentProject') {
          projectContributions[contributionIndex][subKey] = (obj[key] && obj[key]) === 'on' ? true : false;
        } else {
          projectContributions[contributionIndex][subKey] = obj[key];
        }
      }
    } else if (key.startsWith('skillsInfo')) {
      const [skillInfo, subKey] = key.split('-');
      const skillIndexMatch = skillInfo.match(/\d+$/);
      if (skillIndexMatch) {
        const skillIndex = skillIndexMatch[0];
        if (!skills[skillIndex]) {
          skills[skillIndex] = {};
        }
        skills[skillIndex][subKey] = obj[key];
      }
    } else {
      //contributionInfo
      result[key] = obj[key];
    }
  }

  result['openToWork'] = result.openToWork  === 'on' ? true : false;
  result.teamAndRoles = Object.values(teamAndRoles);
  result.projectContributions = Object.values(projectContributions);
  result.skills = Object.values(skills);

  result.projectContributions = result.projectContributions.map((v: any) => {
    if (!v.currentProject) {
      v['currentProject'] = false;
    }
    v['startDate'] = v.startDate === '' ? null : v.startDate;
    if (v['endDate'] === '' || v['endDate'] === null || !v['endDate']) {
      delete v['endDate'];
    } else {
      v['endDate'] = v.endDate
    }

    return v;
  });
  if (result['plnStartDate']) {
    result['plnStartDate'] = new Date(result['plnStartDate']).toISOString();
  } else {
    result['plnStartDate'] = null;
  }

  return result;
}

export const memberRegistrationDefaults = {
  skillsInfo: {
    teamsAndRoles: [],
    skills: [],
    teamOrProjectURL:''
  },
  contributionInfo: [],
  basicInfo: {
    name: '',
    email: '',
    imageFile: '',
    plnStartDate: '',
    city: '',
    region: '',
    country: '',
  },
  socialInfo: {
    linkedinHandler: '',
    discordHandler: '',
    twitterHandler: '',
    githubHandler: '',
    telegramHandler: '',
    officeHours: '',
    comments: '',
  },
};

export const getInitialMemberFormValues = (selectedMember: any) => {
  return{
    skillsInfo: {
      teamsAndRoles: selectedMember.teamMemberRoles ?? [],
      skills: selectedMember.skills ?? [],
      openToWork: selectedMember?.openToWork ?? false,
      teamOrProjectURL: selectedMember?.teamOrProjectURL ?? ''
    },
    contributionInfo: selectedMember?.projectContributions ?? [],
    basicInfo: {
      name: selectedMember?.name ?? '',
      email: selectedMember.email ?? '',
      imageFile: selectedMember?.image?.url ?? '',
      plnStartDate: selectedMember?.plnStartDate ? utcDateToDateFieldString(selectedMember?.plnStartDate) : null,
      city: selectedMember?.location?.city ?? '',
      region: selectedMember?.location?.region ?? '',
      country: selectedMember?.location?.country ?? '',
    },
    socialInfo: {
      linkedinHandler: selectedMember?.linkedinHandler ?? '',
      discordHandler: selectedMember?.discordHandler ?? '',
      twitterHandler: selectedMember?.twitterHandler ?? '',
      githubHandler: selectedMember?.githubHandler ?? '',
      telegramHandler: selectedMember?.telegramHandler ?? '',
      officeHours: selectedMember?.officeHours ?? '',
      moreDetails: selectedMember?.moreDetails ?? '',
    },
  }
}

export const validateTeamsAndSkills = async (formattedData: any) => {
  const errors: string[] = [];
  const result = TeamAndSkillsInfoSchema.safeParse(formattedData);
  if (!result.success) {
    const rawErrors = result.error.errors.map((v) => v.message);
    const uniqueErrors = Array.from(new Set(rawErrors));
    errors.push(...uniqueErrors);
  }
  return errors;
};

export const validateContributionErrors = async (formattedData: any) => {
  const allErrorObj: Record<number, string[]> = {};
  const contributions = formattedData.projectContributions;
  contributions.forEach((contribution: any, index: number) => {
    if (contribution.endDate && new Date(contribution.startDate) >= new Date(contribution.endDate)) {
      if (!allErrorObj[index]) {
        allErrorObj[index] = [];
      }
      allErrorObj[index].push('Your contribution end date cannot be less than or equal to start date');
    }
    if (contribution.startDate && new Date(contribution.startDate) > new Date()) {
      if (!allErrorObj[index]) {
        allErrorObj[index] = [];
      }
      allErrorObj[index].push('Your contribution start date cannot be greater than current date');
    }
  });
  const result = projectContributionSchema.safeParse(formattedData);
  if (!result.success) {
    result.error.errors.forEach((error) => {
      const [name, index] = error.path as [string, number];
      if (!allErrorObj[index]) {
        allErrorObj[index] = [];
      }
      allErrorObj[index].push(error.message);
    });
  }
  return allErrorObj;
};

export const validateBasicForms = async (formattedData: any) => {
  const errors: string[] = [];
  // Validate for basic schema
  const result = basicInfoSchema.safeParse(formattedData);
  if (!result.success) {
    errors.push(...result.error.errors.map((v) => v.message));
  }

  // Validate email
  const email = formattedData?.email?.toLowerCase().trim();
  const emailVerification = await validatePariticipantsEmail(email, 'MEMBER');
  if (!emailVerification.isValid) {
    errors.push('Email already exists');
  }

  // Validate location
  const locationInfo = {
    ...(formattedData.city && { city: formattedData.city }),
    ...(formattedData.country && { country: formattedData.country }),
    ...(formattedData.region && { region: formattedData.region }),
  };
  if (Object.keys(locationInfo).length > 0) {
    const locationVerification = await validateLocation(locationInfo);
    if (!locationVerification.isValid) {
      errors.push('Location info provided is invalid');
    }
  }

  // Validate Image
  const imageFile = formattedData?.memberProfile;
  if (imageFile && imageFile.name) {
    if (!['image/jpeg', 'image/png'].includes(imageFile.type)) {
      errors.push('Please upload image in jpeg or png format');
    } else if (imageFile.size > 4 * 1024 * 1024) {
      errors.push('Please upload a file less than 4MB');
    }
  }

  return errors;
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


