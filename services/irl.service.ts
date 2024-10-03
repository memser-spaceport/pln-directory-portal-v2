import { getHeader } from '@/utils/common.utils';
import { customFetch } from '@/utils/fetch-wrapper';

export const getAllLocations = async () => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(''),
  });

  if (!response.ok) {
    return { isError: true };
  }

  return await response.json();
};

export const getGuestsByLocation = async (location: string, type: string, authToken: string) => {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations/${location}/guests?type=${type}`, {
    cache: 'no-store',
    method: 'GET',
    headers: getHeader(authToken),
  });

  const groupEventsByMemberUid = (events: any) => {
    const groupedEvents: any = {};
    events.forEach((event: any) => {
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
        events: groupedEvents[memberUid]?.map((member: any) => ({ ...member?.event, logo:member.event?.logo.url, isHost: member?.isHost, isSpeaker: member?.isSpeaker,hostSubEvents: member?.additionalInfo?.hostSubEvents, speakerSubEvents: member?.additionalInfo?.speakerSubEvents })),
        topics: groupedEvents[memberUid][0]?.topics,
        officeHours: groupedEvents[memberUid][0]?.member?.officeHours,
        telegramId: groupedEvents[memberUid][0]?.telegramId,
        reason: groupedEvents[memberUid][0]?.reason,
        additionalInfo: groupedEvents[memberUid][0].additionalInfo,
        test: groupedEvents[memberUid],
      };
    });
  };

  const groupedEvents = groupEventsByMemberUid(await response.json());
  const transformedEvents = transformGroupedEvents(groupedEvents);

  if (!response.ok) {
    return { isError: true };
  }

  return { guests: transformedEvents };
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
