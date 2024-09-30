import { getHeader } from "@/utils/common.utils";

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
  
  export const getEventsByLocation = async (location: string, type: string, authToken: string) => {
    const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/locations/${location}/events/guests?type=${type}`, {
      cache: 'no-store',
      method: 'GET',
      headers: getHeader(authToken),
    });
  
    console.log('88', `${process.env.DIRECTORY_API_URL}/v1/irl/locations/${location}/events/guests?type=${type}`);
  
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
          memberUid,
          memberName: groupedEvents[memberUid][0]?.member?.name,
          memberLogo: groupedEvents[memberUid][0]?.member?.image?.url,
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
          events: groupedEvents[memberUid]?.map((member: any) => ({ ...member?.event, isHost: member?.isHost, isSpeaker: member?.isSpeaker })),
          topics: groupedEvents[memberUid][0]?.topics,
          officeHours: groupedEvents[memberUid][0]?.member?.officeHours,
          telegramId: groupedEvents[memberUid][0]?.telegramId,
          reason: groupedEvents[memberUid][0]?.reason,
          addtionalInfo: groupedEvents[memberUid],
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