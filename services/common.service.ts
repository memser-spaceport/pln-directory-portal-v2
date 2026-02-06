async function fetchData(url: string, tag: string) {
  const response = await fetch(url, {
    method: 'GET',
    next: { tags: [tag], revalidate: 60 }, // Cache with revalidation every 1 minute
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response?.ok) {
    return {
      error: {
        statusText: response?.statusText,
      },
    };
  }

  return {
    data: await response.json(),
  };
}

export async function getFocusAreas(type: string, queryParams: any) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/focus-areas?type=${type}&${new URLSearchParams(queryParams)}`;

  return await fetchData(url, 'focus-areas');
}

export async function getMembershipSource(type: string, queryParams: any) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/membership-sources?type=${type}&${new URLSearchParams(queryParams)}`;

  return await fetchData(url, 'membership-source');
}

export async function getIndustryTags(type: string, queryParams: any) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/industry-tags?type=${type}&${new URLSearchParams(queryParams)}`;

  return await fetchData(url, 'industry-tags');
}

export async function getFundingStages(type: string, queryParams: any) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/funding-stages?type=${type}&${new URLSearchParams(queryParams)}`;

  return await fetchData(url, 'funding-stages');
}
