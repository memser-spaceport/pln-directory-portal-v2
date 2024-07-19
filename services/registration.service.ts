export const getTeamsFormOptions = async () => {
  const [membershipSourcesResponse, fundingTagsresponse, industryTagsResponse, technologiesResponse, focusAreaResponse] = await Promise.all([
    fetch(`${process.env.DIRECTORY_API_URL}/v1/membership-sources`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/funding-stages?pagination=false`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/industry-tags?pagination=false`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/technologies?pagination=false`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/focus-areas`, { method: 'GET' }),
  ]);

  const membershipSources = await membershipSourcesResponse.json();
  const fundingTags = await fundingTagsresponse.json();
  const industryTags = await industryTagsResponse.json();
  const technologies = await technologiesResponse.json();
  const focusAreas = await focusAreaResponse.json();

  if (!membershipSourcesResponse.ok || !fundingTagsresponse.ok || !industryTagsResponse.ok || !technologiesResponse.ok || !focusAreaResponse.ok) {
    return { isError: true };
  }

  const formattedTechnologies = technologies
    ?.map((technology: any) => ({
      id: technology?.uid,
      name: technology?.title,
    }))
    .sort((a: any, b: any) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  const formattedFundingStages = fundingTags.map((tag: any) => ({ id: tag?.uid, name: tag?.title })).sort((a: any, b: any) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

  const formattedMembershipResources = membershipSources?.map((source: any) => ({
    id: source?.uid,
    name: source?.title,
  }));

  const formattedIndustryTags = industryTags.map((tag: any) => ({ id: tag?.uid, name: tag?.title })).sort((a: any, b: any) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  const formattedFocusAreas = focusAreas.filter((data: any) => !data.parentUid);
  return { technologies: formattedTechnologies, focusAreas: formattedFocusAreas, fundingStage: formattedFundingStages, membershipSources: formattedMembershipResources, industryTags: formattedIndustryTags };
};

export const saveRegistrationImage = async (payload: any) => {
  const formData = new FormData();
  formData.append('file', payload);
  const requestOptions = {
    method: 'POST',
    body: formData,
  };
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/images`, requestOptions);
  if (!response?.ok) {
    throw new Error(response?.statusText, { cause: { response } });
  }
  const result = await response?.json();
  return result;
};
