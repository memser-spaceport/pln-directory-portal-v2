export const plaaApiHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(process.env.PLAA_API_KEY ? { 'x-api-key': process.env.PLAA_API_KEY } : {}),
});
