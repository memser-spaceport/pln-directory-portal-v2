export const getTeamsFormOptions = async () => {
  const [membershipSourcesResponse, fundingTagsresponse, industryTagsResponse, technologiesResponse] = await Promise.all([
    fetch(`${process.env.DIRECTORY_API_URL}/v1/membership-sources`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/funding-stages?pagination=false`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/industry-tags?pagination=false`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/technologies?pagination=false`, { method: 'GET' }),
  ]);

  const membershipSources = await membershipSourcesResponse.json();
  const fundingTags = await fundingTagsresponse.json();
  const industryTags = await industryTagsResponse.json();
  const technologies = await technologiesResponse.json();

  if (!membershipSourcesResponse.ok || !fundingTagsresponse.ok || !industryTagsResponse.ok || !technologiesResponse.ok) {
    return { isError: true };
  }

  const formattedTechnologies = technologies?.map((technology: any) => ({
    id: technology?.uid,
    name: technology?.title,
  }));

  const formattedFundingStages = fundingTags.map((tag: any) => ({ id: tag?.uid, name: tag?.title }));

  const formattedMembershipResources = membershipSources?.map((source: any) => ({
    id: source?.uid,
    name: source?.title,
  }));

  const formattedIndustryTags = industryTags.map((tag: any) => ({ id: tag?.uid, name: tag?.title }));

  return { technologies: formattedTechnologies, fundingStage: formattedFundingStages, membershipSources: formattedMembershipResources, industryTags: formattedIndustryTags };
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
