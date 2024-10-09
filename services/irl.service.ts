import { getHeader } from '@/utils/common.utils';
import { customFetch } from '@/utils/fetch-wrapper';
import { sortPastEvents } from '@/utils/irl.utils';

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

  result.forEach((item: { pastEvents: any[]; }) => {
    if (Array.isArray(item.pastEvents)) {
      item.pastEvents = sortPastEvents(item.pastEvents);
    }
  });

  return result;
};

export const getGuestsByLocation = async (location: string, type: string, authToken: string, slugURL: string) => {
  if (!slugURL) {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations/${location}/guests?type=${type}`, {
      cache: 'no-store',
      method: 'GET',
      headers: getHeader(authToken),
    });

    if (!response.ok) {
      return { isError: true };
    }

    const result = await response.json();

    const groupEventsByMemberUid = (events: any) => {
      const groupedEvents: any = {};
      events?.forEach((event: any) => {
        if (!groupedEvents[event.memberUid]) {
          groupedEvents[event.memberUid] = [];
        }
        groupedEvents[event.memberUid].push(event);
      });

      return groupedEvents;
    };

    const transformGroupedEvents = (groupedEvents: any) => {
      return Object.keys(groupedEvents).map((memberUid) => {
        return {
          memberUid: groupedEvents[memberUid][0].member ? memberUid : null,
          memberName: groupedEvents[memberUid][0]?.member?.name,
          memberLogo: groupedEvents[memberUid][0]?.member?.image?.url,
          teamUid: groupedEvents[memberUid][0]?.teamUid,
          teamName: groupedEvents[memberUid][0]?.team?.name,
          teamLogo: groupedEvents[memberUid][0]?.team?.logo?.url,
          teams: groupedEvents[memberUid][0]?.member?.teamMemberRoles?.map((tm: any) => {
            return {
              name: tm?.team?.name,
              id: tm?.team?.uid,
              role: tm?.role,
              logo: tm?.team?.logo?.url ?? '',
            };
          }),
          projectContributions: groupedEvents[memberUid][0]?.member?.projectContributions?.filter((pc: any) => !pc?.project?.isDeleted)?.map((item: any) => item?.project?.name),
          eventNames: groupedEvents[memberUid]?.map((member: any) => member?.event?.name),
          events: groupedEvents[memberUid]?.map((member: any) => ({
            ...member?.event,
            logo: member?.event?.logo?.url,
            isHost: member?.isHost,
            isSpeaker: member?.isSpeaker,
            hostSubEvents: member?.additionalInfo?.hostSubEvents,
            speakerSubEvents: member?.additionalInfo?.speakerSubEvents,
            type: member?.event?.type,
          })),
          topics: groupedEvents[memberUid][0]?.topics,
          officeHours: groupedEvents[memberUid][0]?.member?.officeHours,
          telegramId: groupedEvents[memberUid][0]?.telegramId,
          reason: groupedEvents[memberUid][0]?.reason,
          additionalInfo: groupedEvents[memberUid][0]?.additionalInfo,
        };
      });
    };

    const groupedEvents = groupEventsByMemberUid(result);
    const transformedEvents = transformGroupedEvents(groupedEvents);
    return { guests: transformedEvents };
  } else {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations/${location}/events/${slugURL}`, {
      cache: 'no-store',
      method: 'GET',
      headers: getHeader(authToken),
    });

    if (!response.ok) {
      return { isError: true };
    }

    const result = await response.json();

    const guests = result?.eventGuests?.map((guest: any) => {
      const teamMemberRoles = guest?.member?.teamMemberRoles.map((tm: any) => {
        return {
          name: tm?.team?.name,
          id: tm?.team?.uid,
          role: tm?.role,
          logo: tm?.team?.logo?.url ?? '',
        };
      });

      const projectContributions = guest?.member?.projectContributions?.filter((pc: any) => !pc?.project?.isDeleted)?.map((item: any) => item?.project?.name);

      return {
        teamUid: guest?.teamUid,
        teamName: guest?.team?.name,
        teamLogo: guest?.team?.logo?.url,
        memberUid: guest?.memberUid,
        memberName: guest?.member?.name,
        memberLogo: guest?.member?.image?.url,
        teams: teamMemberRoles,
        reason: guest?.reason,
        telegramId: guest?.member?.telegramHandler || '',
        isTelegramRemoved: guest?.telegramId === '',
        officeHours: guest?.member?.officeHours || '',
        createdAt: guest?.createdAt,
        projectContributions,
        topics: guest?.topics,
        additionalInfo: guest?.additionalInfo,
        eventNames: [result?.name],
        events: [{ uid: result?.uid, name: result?.name, logo: result?.logo?.url, hostSubEvents: guest?.additionalInfo?.hostSubEvents, speakerSubEvents: guest?.additionalInfo?.speakerSubEvents }],
      };
    });

    return { guests };
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
