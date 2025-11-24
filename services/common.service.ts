async function fetchData(url: string, tag: string) {
  const response = await fetch(url, {
    method: 'GET',
    cache: 'force-cache',
    next: { tags: [tag] },
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
