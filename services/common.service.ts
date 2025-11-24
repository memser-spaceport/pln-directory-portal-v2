async function handleResponse(response: Response) {
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

export const getFocusAreas = async (type: string, queryParams: any) => {
  const url = `${process.env.DIRECTORY_API_URL}/v1/focus-areas?type=${type}&${new URLSearchParams(queryParams)}`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'force-cache',
    next: { tags: ['focus-areas'] },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse(response);
};

export const getMembershipSource = async (type: string, queryParams: any) => {
  const url = `${process.env.DIRECTORY_API_URL}/v1/membership-sources?type=${type}&${new URLSearchParams(queryParams)}`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'force-cache',
    next: { tags: ['membership-source'] },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse(response);
};
