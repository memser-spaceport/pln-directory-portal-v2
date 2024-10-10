import { getHeader } from '@/utils/common.utils';
import { ADMIN_ROLE } from '@/utils/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { sortByDefault, sortPastEvents } from '@/utils/irl.utils';

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

  result.forEach((item: { pastEvents: any[] }) => {
    if (Array.isArray(item.pastEvents)) {
      item.pastEvents = sortPastEvents(item.pastEvents);
    }
  });

  return result;
};

export const getGuestsByLocation = async (location: string, type: string, authToken: string, slugURL: string, userInfo: any) => {
  const fetchGuests = async (url: string) => {
    const response = await fetch(url, {
      cache: 'no-store',
      method: 'GET',
      headers: getHeader(authToken),
    });

    if (!response.ok) return { isError: true };
    return await response.json();
  };

  const processGuests = (guests: any[], userInfo: any) => {
    const currentUserEntries = guests?.filter((guest: any) => guest?.member?.uid === userInfo?.uid);
    const inviteOnlyEvents = currentUserEntries?.filter((entry: any) => entry?.event?.type === 'INVITE_ONLY').map((entry: any) => entry?.event?.uid);

    const inviteOnlyEventMembers = guests.filter((r: any) => r?.event?.type === 'INVITE_ONLY' && inviteOnlyEvents.includes(r?.event?.uid));
    const publicEventMembers = guests.filter((r: any) => r.event.type !== 'INVITE_ONLY');

    return [...inviteOnlyEventMembers, ...publicEventMembers];
  };

  const groupMembers = (events: any) => {
    const groupedMembers: any = {};
    events?.forEach((event: any) => {
      if (!groupedMembers[event.memberUid]) {
        groupedMembers[event.memberUid] = [];
      }
      groupedMembers[event.memberUid].push(event);
    });

    return groupedMembers;
  };

  const transformMembers = (groupedMembers: any) => {
    return Object.keys(groupedMembers)?.map((memberUid) => ({
      memberUid,
      memberName: groupedMembers[memberUid][0]?.member?.name,
      memberLogo: groupedMembers[memberUid][0]?.member?.image?.url,
      teamUid: groupedMembers[memberUid][0]?.teamUid,
      teamName: groupedMembers[memberUid][0]?.team?.name,
      teamLogo: groupedMembers[memberUid][0]?.team?.logo?.url,
      teams: groupedMembers[memberUid][0]?.member?.teamMemberRoles?.map((tm: any) => ({
        name: tm?.team?.name,
        id: tm?.team?.uid,
        role: tm?.role,
        logo: tm?.team?.logo?.url ?? '',
      })),
      projectContributions: groupedMembers[memberUid][0]?.member?.projectContributions?.filter((pc: any) => !pc?.project?.isDeleted)?.map((item: any) => item?.project?.name),
      eventNames: groupedMembers[memberUid].map((member: any) => member?.event?.name),
      events: groupedMembers[memberUid].map((member: any) => ({
        ...member?.event,
        logo: member?.event?.logo?.url,
        isHost: member?.isHost,
        isSpeaker: member?.isSpeaker,
        hostSubEvents: member?.additionalInfo?.hostSubEvents,
        speakerSubEvents: member?.additionalInfo?.speakerSubEvents,
        type: member?.event?.type,
      })),
      topics: groupedMembers[memberUid][0]?.topics,
      officeHours: groupedMembers[memberUid][0]?.member?.officeHours,
      telegramId: groupedMembers[memberUid][0]?.telegramId,
      reason: groupedMembers[memberUid][0]?.reason,
      additionalInfo: groupedMembers[memberUid][0]?.additionalInfo,
    }));
  };

  const sortGuestList = (guests: any, userInfo: any) => {
    let sortedGuests = sortByDefault(guests);
    let isUserGoing = false;
    let currentUser = null;

    // Check if the current user is part of the guest list
    if (userInfo) {
      const currentUserIndex = sortedGuests.findIndex((guest) => guest.memberUid === userInfo.uid);
      if (currentUserIndex !== -1) {
        currentUser = sortedGuests[currentUserIndex];
        // Move the current user to the top of the list
        sortedGuests = [currentUser, ...sortedGuests.filter((guest, index) => index !== currentUserIndex)];
        isUserGoing = true; // Set isUserGoing to true if user is found
      }
    }

    // Return sortedGuests, isUserGoing, and currentUser
    return { sortedGuests, isUserGoing, currentUser };
  };

  if (!slugURL) {
    const url = `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${location}/guests?type=${type}`;
    let result = await fetchGuests(url);
    if (result.isError) return { isError: true };

    if (userInfo && !userInfo?.roles?.includes(ADMIN_ROLE)) {
      result = processGuests(result, userInfo);
    } else if (!userInfo) {
      result = result.filter((r: any) => r.event.type !== 'INVITE_ONLY');
    }

    const groupedMembers = groupMembers(result);
    const transformedMembers = transformMembers(groupedMembers);
    const sortedList = sortGuestList(transformedMembers, userInfo);

    return { isUserGoing: sortedList.isUserGoing, currentGuest: sortedList.currentUser, guests: sortedList.sortedGuests };
  } else {
    const url = `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${location}/events/${slugURL}`;
    let result = await fetchGuests(url);
    if (result.isError) return { isError: true };

    if (!userInfo && result.type === 'INVITE_ONLY') {
      result.eventGuests = [];
    }
    if (userInfo && !userInfo.roles.includes(ADMIN_ROLE) && result.type === 'INVITE_ONLY' && !result.eventGuests.find((guest: any) => guest?.memberUid === userInfo?.uid)) {
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
          uid: result.uid,
          name: result.name,
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

    return { isUserGoing: sortedList.isUserGoing, currentGuest: sortedList.currentUser, guests: sortedList.sortedGuests };
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

export const editEventGuest = async (locationId: string, guestUid: string, payload: any) => {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${locationId}/guests/${guestUid}`,
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
