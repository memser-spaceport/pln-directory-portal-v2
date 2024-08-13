export const getFeaturedData = async () => {
  const url = `${process.env.DIRECTORY_API_URL}/v1/dashboards/featured/all`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  return await { data: await response.json() };
};
