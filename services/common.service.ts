export const getFocusAreas = async (type: string, queryParams: any) => {
  const url = `${process.env.DIRECTORY_API_URL}/v1/focus-areas?type=${type}&${new URLSearchParams(queryParams)}`;

  const response = await fetch(url, {
    method: 'GET',
    next: { tags: ['focus-areas'] },
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  return await { data: await response.json() };
};
