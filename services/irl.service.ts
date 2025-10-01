import { IPastEvents, IUpcomingEvents } from '@/types/irl.types';
import { getHeader } from '@/utils/common.utils';
import { customFetch } from '@/utils/fetch-wrapper';
import { transformMembers, sortEvents, parseDateString } from '@/utils/irl.utils';
import { isError } from 'util';

export const getAllLocations = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations?pagination=false`, {
    cache: 'force-cache',
    next: { tags: ['irl-locations'] },
    method: 'GET',
    headers: getHeader(''),
  });

  if (!response.ok) {
    return { isError: true };
  }

  const result = await response.json();
  result.sort((a: { priority: number | null }, b: { priority: number | null }) => {
    if (a.priority === null && b.priority === null) return 0;
    if (a.priority === null) return 1;
    if (b.priority === null) return -1;
    return a.priority - b.priority;
  });

  const filteredResult = result.filter(
    (item: { pastEvents: IPastEvents[]; upcomingEvents: IUpcomingEvents[] }) =>
      item.pastEvents.length > 0 || item.upcomingEvents.length > 0,
  );

  filteredResult.forEach((location: any) => {
    if (location.events && location.events.length > 0) {
      location.events = sortEvents(location.events, 'all');
    }

    if (location.pastEvents && location.pastEvents.length > 0) {
      location.pastEvents = sortEvents(location.pastEvents, 'past');
    }

    if (location.upcomingEvents && location.upcomingEvents.length > 0) {
      location.upcomingEvents = sortEvents(location.upcomingEvents, 'upcoming');
    }
  });

  return filteredResult;
};

const fetchGuests = async (url: string, authToken: string) => {
  const response = await fetch(url, {
    cache: 'no-store',
    // next: { tags: ['irl-guests'] },
    method: 'GET',
    headers: getHeader(authToken),
  });
  if (!response.ok) return { isError: true };
  return await response.json();
};

export const getGuestsByLocation = async (
  location: string,
  searchParams: any,
  authToken: string,
  currentEventNames: string[],
  currentPage = 1,
  limit = 10,
) => {  
  // Always make dual API calls to get both counts
  let upcomingParams: any;
  let pastParams: any;
  if (searchParams?.type ==='past' ) {
    upcomingParams = { type: 'upcoming' };
    pastParams = { ...searchParams, type: 'past' };
  } else if (searchParams?.type ==='upcoming' ) {
    upcomingParams = { ...searchParams, type: 'upcoming' };
    pastParams = { type: 'past' };
  } else {
    upcomingParams = { ...searchParams, type: 'upcoming' };
    pastParams = { ...searchParams, type: 'past' };
  }
  
  // Make both API calls in parallel
  const [upcomingResult, pastResult] = await Promise.all([
    fetchGuestsWithParams(location, upcomingParams, authToken, currentEventNames, currentPage, limit),
    fetchGuestsWithParams(location, pastParams, authToken, currentEventNames, currentPage, limit)
  ]);
  
  if (upcomingResult.isError || pastResult.isError) {
    return { isError: true };
  }
  
  const upcomingCount = upcomingResult.totalGuests || 0;
  const pastCount = pastResult.totalGuests || 0;
  
  // Logic for determining selectedType and data to return
  const selectedType = searchParams?.type 
    ? searchParams.type 
    : upcomingCount === 0 && pastCount > 0 
      ? 'past' 
      : 'upcoming';
  
    const actualResult = selectedType === 'past' ? pastResult : upcomingResult;
  
  if (actualResult.isError) {
    return { isError: true };
  }
  
  return {
    guests: actualResult.guests,
    totalGuests: actualResult.totalGuests,
    selectedType,
    upcomingCount,
    pastCount
  };
};

// Helper function to fetch guests with parameters
const fetchGuestsWithParams = async (
  location: string,
  searchParams: any,
  authToken: string,
  currentEventNames: string[],
  currentPage: number,
  limit: number
) => {
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
    true,
  );

  if (!response?.ok) {
    return false;
  }

  return true;
};

export const createEventGuest = async (locationId: string, payload: any, type: string) => {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/guests?type=${type}`,
    {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    return { error: response };
  }
  return { data: response };
};

export const markMyPresence = async (locationId: string, payload: any, type: string) => {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/me/presence-request?type=${type}`,
    {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
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
    true,
  );

  if (!response?.ok) {
    return { error: response };
  }

  return { data: response };
};

export const getGuestEvents = async (locationId: string, authToken: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/me/events`, {
    cache: 'force-cache',
    next: { tags: ['irl-guest-events'] },
    method: 'GET',
    headers: getHeader(authToken),
  });
  if (!response.ok) return [];
  return await response.json();
};

export const getTopicsByLocation = async (locationId: string, type: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/topics?type=${type}`, {
    cache: 'force-cache',
    next: { tags: ['irl-locations-topic'] },
    method: 'GET',
    headers: getHeader(''),
  });

  if (!response.ok) {
    return [];
  }

  return await response.json();
};

export const getTopicsAndReasonForUser = async (locationId: string, userId: string, authToken: string) => {
  const response = await fetch(
    `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/guests/${userId}/topics`,
    {
      cache: 'no-store',
      method: 'GET',
      headers: getHeader(authToken),
    },
  );

  if (!response.ok) {
    return { isError: true };
  }

  return await response.json();
};

export const getGuestDetail = async (guestId: string, locationId: string, authToken: string, type: string) => {
  const response = await fetch(
    `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/guests/${guestId}?type=${type}`,
    {
      cache: 'no-store',
      method: 'GET',
      headers: getHeader(authToken),
    },
  );

  if (!response.ok) {
    return [];
  }

  return await response.json();
};

export const getFollowersByLocation = async (locationId: string, authToken: string) => {
  const response = await fetch(
    `${process.env.DIRECTORY_API_URL}/v1/member-subscriptions?entityUid=${locationId}&isActive=true&pagination=false&select=uid,memberUid,entityUid,entityAction,entityType,isActive,member.image.url,member.name,member.ohStatus,member.scheduleMeetingCount,member.officeHours,member.teamMemberRoles.team,member.teamMemberRoles.role,member.teamMemberRoles.mainTeam`,
    {
      cache: 'no-store',
      method: 'GET',
      headers: getHeader(''),
    },
  );

  if (!response.ok) {
    return {
      isError: true,
    };
  }

  const result = await response.json();

  const formattedData = result?.map((follower: any) => {
    const teams =
      follower?.member?.teamMemberRoles?.map((teamMemberRole: any) => ({
        id: teamMemberRole.team?.uid || '',
        name: teamMemberRole.team?.name || '',
        role: teamMemberRole.role || 'Contributor',
        teamLead: !!teamMemberRole.teamLead,
        mainTeam: !!teamMemberRole.mainTeam,
        logo: teamMemberRole?.team?.logo?.url || '',
      })) || [];

    const teamAndRoles = teams.map((team: any) => ({
      teamTitle: team.name,
      role: team.role,
      teamUid: team.id,
    }));

    const teamLead = teams.some((team: any) => team.teamLead);
    // const roles = Array.from(new Set(teams.map((team: any) => team.role)));
    const roles = teams.filter((team: any) => team.mainTeam).map((team: any) => team.role);

    return {
      uid: follower?.uid,
      name: follower?.member?.name,
      memberUid: follower?.memberUid,
      entityUid: follower?.entityUid,
      entityAction: follower?.entityAction,
      entityType: follower?.entityType,
      isActive: follower?.isActive,
      logo: follower?.member?.image?.url,
      teamLead: teamLead,
      roles: Array.isArray(roles) ? roles : [],
      teams,
      member: follower?.member,
    };
  });

  return {
    data: formattedData,
  };
};

export const deleteEventLocation = async (locationId: string, eventId: string, authToken: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/events/${eventId}`, {
    cache: 'no-store',
    method: 'DELETE',
    headers: getHeader(authToken),
  });

  if (!response.ok) {
    return {
      isError: true,
    };
  }

  return await response.json();
};
