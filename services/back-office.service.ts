export const getBackOffice = async () => {
  const token = 'Bearer token';

  const response = await fetch(`http://localhost:3000/v1/admin/participants-request`, {
    cache: 'no-store',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json',
    },
  });
  if (!response?.ok) {
    return { error: { status: response?.status, statusText: response?.statusText } };
  }
  const result = await response?.json();
  const formattedData: any = result;
  return { data: formattedData };
};


export const updateTeams = async (payload: any) => {
  const result = await fetch(`http://localhost:3000/v1/admin/participants-request `, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    const errorData = await result.json();
    return {
      isError: true,
      errorData,
      errorMessage: result.statusText,
      status: result.status
    }
  }
}