export const plaaApiHeaders = (authToken?: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
});
