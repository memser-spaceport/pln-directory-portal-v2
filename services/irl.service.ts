import { IPastEvents, IUpcomingEvents } from '@/types/irl.types';
import { getHeader } from '@/utils/common.utils';
import { customFetch } from '@/utils/fetch-wrapper';
import { sortPastEvents, transformMembers } from '@/utils/irl.utils';

export const getAllLocations = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(''),
  });

  if (!response.ok) {
    return { isError: true };
  }

  const result = await response.json();
  result.sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority);

  const filteredResult = result.filter(
    (item: { pastEvents: IPastEvents[]; upcomingEvents: IUpcomingEvents[]; }) =>
      item.pastEvents.length > 0 || item.upcomingEvents.length > 0
  );

  return filteredResult;
};

const fetchGuests = async (url: string, authToken: string) => {
  const response = await fetch(url, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(authToken),
  });
  if (!response.ok) return { isError: true };
  return await response.json();
};

export const getGuestsByLocation = async (location: string, searchParams: any, authToken: string,currentEventNames: string[], currentPage = 1, limit = 10) => {
  const urlParams = new URLSearchParams() as any;

  // Loop through the searchParams object
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      // If the value is an array, append each item
      value.forEach((item) => urlParams.append(key, item));
    } else {
      // Append other values normally
      urlParams.append(key, value);
    }
  }
  const url = `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${location}/guests?&page=${currentPage}&limit=${limit}&${urlParams.toString()}`;
  
  let result = await fetchGuests(url, authToken);
  if (result.isError) return { isError: true };

  const transformedMembers = transformMembers(result, currentEventNames);

  return { guests: transformedMembers, totalGuests: transformedMembers[0]?.count ?? 0 };
};

export const deleteEventGuestByLocation = async (location: string, payload: any) => {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${location}/events/guests`,
    {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    true
  );

  if (!response?.ok) {
    return false;
  }

  return true;
};

export const createEventGuest = async (locationId: string, payload: any) => {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/guests`,
    {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true
  );

  if (!response?.ok) {
    return { error: response };
  }
  return { data: response };
};

export const editEventGuest = async (locationId: string, guestUid: string, payload: any, eventType: string) => {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/guests/${guestUid}?type=${eventType}`,
    {
      method: 'PUT',
      cache: 'no-store',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true
  );

  if (!response?.ok) {
    return { error: response };
  }

  return { data: response };
};

export const getGuestEvents = async (locationId: string, authToken: string,) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/me/events`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(authToken),
  });
  if (!response.ok) return [];
  return await response.json();
};

export const getTopicsByLocation = async (locationId: string, type: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/topics?type=${type}`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(''),
  });

  if (!response.ok) {
    return [];
  }

  return await response.json();
};

export const getGuestDetail = async (guestId: string, locationId: string, authToken:string, type: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/guests/${guestId}?type=${type}`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(authToken),
  });

  if (!response.ok) {
    return [];
  }

  return await response.json();
};
