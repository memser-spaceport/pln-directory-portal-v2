import { getHeader } from '@/utils/common.utils';
import { ADMIN_ROLE, URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { groupMembers, processGuests, sortGuestList, sortPastEvents, transformMembers } from '@/utils/irl.utils';

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

  result.forEach((item: { pastEvents: any[] }) => {
    if (Array.isArray(item.pastEvents)) {
      item.pastEvents = sortPastEvents(item.pastEvents);
    }
  });

  return result;
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

export const getGuestsByLocation = async (location: string, type: string, authToken: string, slugURL: string, userInfo: any, searchParams: any) => {
  if (!slugURL) {
    const url = `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${location}/guests?type=${type}`;
    let result = await fetchGuests(url, authToken);
    if (result.isError) return { isError: true };

    if (userInfo && !userInfo?.roles?.includes(ADMIN_ROLE)) {
      result = processGuests(result, userInfo);
    } else if (!userInfo) {
      result = result.filter((r: any) => r?.event?.type !== 'INVITE_ONLY');
    }

    const groupedMembers = groupMembers(result);
    const transformedMembers = transformMembers(groupedMembers);
    const sortedList = sortGuestList(transformedMembers, userInfo);

    const attendingQueryParam = searchParams?.attending;
    const attendingItems = new Set(attendingQueryParam ? attendingQueryParam.split(URL_QUERY_VALUE_SEPARATOR) : []);
    const attendingFilteredList =
      attendingItems.size > 0 ? [...sortedList.sortedGuests]?.filter((item) => item.eventNames?.some((event: any) => attendingItems?.has(event))) : [...sortedList.sortedGuests];

    // const topicsQueryParam = searchParams?.topics;
    // const selectedTopics = new Set(topicsQueryParam ? topicsQueryParam.split(',') : []);
    // const topicsFilteredList = selectedTopics.size > 0 ? [...attendingFilteredList]?.filter((item) => item.topics.some((topic: any) => selectedTopics?.has(topic))) : [...attendingFilteredList];

    return { isUserGoing: sortedList.isUserGoing, currentGuest: sortedList.currentUser, guests: attendingFilteredList, hasAttendees: result.length > 0 };
  } else {
    const url = `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${location}/events/${slugURL}`;
    let result = await fetchGuests(url, authToken);

    if (result.isError) return { isError: true };

    if (!userInfo && result?.type === 'INVITE_ONLY') {
      result.eventGuests = [];
    }
    if (userInfo && !userInfo?.roles?.includes(ADMIN_ROLE) && result?.type === 'INVITE_ONLY' && !result?.eventGuests.find((guest: any) => guest?.memberUid === userInfo?.uid)) {
      result.eventGuests = [];
    }

    const guests = result.eventGuests.map((guest: any) => ({
      teamUid: guest?.teamUid,
      teamName: guest?.team?.name,
      teamLogo: guest?.team?.logo?.url,
      memberUid: guest?.memberUid,
      memberName: guest?.member?.name,
      memberLogo: guest?.member?.image?.url,
      teams: guest?.member?.teamMemberRoles.map((tm: any) => ({
        name: tm?.team?.name,
        id: tm?.team?.uid,
        role: tm?.role,
        logo: tm?.team?.logo?.url ?? '',
      })),
      reason: guest?.reason,
      telegramId: guest?.member?.telegramHandler || '',
      isTelegramRemoved: guest?.telegramId === '',
      officeHours: guest?.member?.officeHours || '',
      createdAt: guest?.createdAt,
      projectContributions: guest?.member?.projectContributions?.filter((pc: any) => !pc?.project?.isDeleted).map((item: any) => item?.project?.name),
      topics: guest?.topics,
      additionalInfo: guest?.additionalInfo,
      eventNames: [result.name],
      events: [
        {
          uid: result?.uid,
          name: result?.name,
          startDate: result?.startDate,
          endDate: result?.endDate,
          isHost: guest?.isHost,
          isSpeaker: guest?.isSpeaker,
          logo: result?.logo?.url,
          hostSubEvents: guest?.additionalInfo?.hostSubEvents,
          speakerSubEvents: guest?.additionalInfo?.speakerSubEvents,
          type: guest?.event?.type,
        },
      ],
    }));

    const sortedList = sortGuestList(guests, userInfo);

  
    return { isUserGoing: sortedList.isUserGoing, currentGuest: sortedList.currentUser, guests:sortedList.sortedGuests, hasAttendees: result.eventGuests.length > 0 };
  }
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
