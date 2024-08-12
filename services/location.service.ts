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

type ApiResponse<T> = T | { message: string };

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData: ApiResponse<T> = await response.json();
    const errorMessage = (errorData as { message?: string }).message || 'Something went wrong';
    throw new Error(errorMessage);
  }
  return response.json();
};

const handleError = (error: any): void => {
  console.error('Location API call failed:', error);
  throw error;
};

export const getCountries = async (): Promise<any> => {
  try {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/locations/countries`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse<any>(response);
  } catch (error) {
    handleError(error);
  }
};

export const getStates = async (): Promise<any> => {
  try {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/locations/states`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<any>(response);
  } catch (error) {
    handleError(error);
  }
};

export const getStatesByCountry = async (country: string): Promise<any> => {
  try {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/locations/countries/${country}/states`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse<any>(response);
  } catch (error) {
    handleError(error);
  }
};

export const getCitiesByCountry = async (country: string): Promise<any> => {
  try {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/locations/countries/${country}/cities`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return handleResponse<any>(response);
  } catch (error) {
    handleError(error);
  }
};

export const getCitiesByCountryAndState = async (country: string, state: string): Promise<any> => {
  try {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/locations/countries/${country}/states/${state}/cities`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse<any>(response);
  } catch (error) {
    handleError(error);
  }
};


