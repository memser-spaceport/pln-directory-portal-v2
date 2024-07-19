import { isValid } from 'zod';

export const validateLocation = async (locationData: any) => {
  const locationResult = await fetch(`${process.env.DIRECTORY_API_URL}/v1/locations/validate`, {
    method: 'POST',
    body: JSON.stringify(locationData),
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!locationResult.ok) {
    if (locationResult.status === 400) {
      return { isValid: false };
    }
    return { isError: true };
  }

  const locationValidation = await locationResult.json();
  return {
    isValid: locationValidation?.status === 'OK',
  };
};
