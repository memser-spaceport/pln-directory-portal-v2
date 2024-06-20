export const getTeamsFormOptions = async () => {
  const [membershipSourcesResponse, fundingTagsresponse, industryTagsResponse, protocalsResponse] = await Promise.all([
    fetch(`${process.env.DIRECTORY_API_URL}/v1/membership-sources`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/funding-stages?pagination=false`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/industry-tags?pagination=false`, { method: 'GET' }),
    fetch(`${process.env.DIRECTORY_API_URL}/v1/technologies?pagination=false`, { method: 'GET' }),
  ]);

  const membershipSources = await membershipSourcesResponse.json();
  const fundingTags = await fundingTagsresponse.json();
  const industryTags = await industryTagsResponse.json();
  const protocals = await protocalsResponse.json();

  console.log(membershipSources,fundingTags, industryTags, protocals)

  return { technologies: '', fundingStage: '', membershipSources: '', industryTags: '' };
};
