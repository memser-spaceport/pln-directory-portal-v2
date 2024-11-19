export const getFocusAreas = async (type: string, queryParams: any) => {
  const includeFriends = queryParams?.includeFriends ?? 'false';
  const officeHoursFilter = queryParams?.officeHoursOnly ?? false;
  const url = `${process.env.DIRECTORY_API_URL}/v1/focus-areas?type=${type}&plnFriend=${includeFriends}&officeHours=${officeHoursFilter}&${new URLSearchParams(queryParams)}`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'force-cache',
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
