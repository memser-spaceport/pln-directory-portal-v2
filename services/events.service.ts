"use server"
import { getHeader } from "@/utils/common.utils";
import { EVENTS_TEAM_UID } from "@/utils/constants";
import { getFormattedEvents, getFormattedLocations } from "@/utils/home.utils";

export const getAggregatedEventsData = async (authToken?: any, isLoggedIn?: boolean, isAdmin?: boolean) => {
    let url = `${process.env.DIRECTORY_API_URL}/v1/irl/aggregated-data`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeader(authToken),
      });
    
      if (!response.ok) {
        return { error: { statusText: response.statusText } };
      }
  
      const result = await response.json();
    
      const formattedEvents = getFormattedEvents(result?.events || []);
      let formattedLocations = getFormattedLocations(result?.locations || []);
  
      formattedLocations = formattedLocations.sort((a: any, b: any) => {
        const getFirstImage = (location: any) =>
          location.followers?.flatMap((follower: any) =>
            Array.isArray(follower.member) ? follower.member : []
          ).find((member: any) => member.image?.url);
      
        const aHasImage = !!getFirstImage(a);
        const bHasImage = !!getFirstImage(b);
      
        if (!aHasImage && bHasImage) return 1;  
        if (aHasImage && !bHasImage) return -1;
        return a.category.localeCompare(b.category);
      });
      
      const maxLength = Math.max(formattedEvents.length, formattedLocations.length);
    
      const combinedData = [];
      for (let i = 0; i < maxLength; i++) {
        if (formattedEvents[i] !== undefined) combinedData.push(formattedEvents[i]);
        if (formattedLocations[i] !== undefined) combinedData.push(formattedLocations[i]);
      }
    
      return { data: combinedData };
    } catch (error) {
      console.error('Error fetching aggregated events data:', error);
      return { error: { message: 'Failed to fetch aggregated events data' } };
    }
};

export const getEventContributors = async () => {
  let url = `${process.env.DIRECTORY_API_URL}/v1/irl/events/contributors`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getHeader(""),
        'Cache-Control': 'no-cache', // Disable caching
      },
    });

    if (!response?.ok) {
      return { error: { statusText: response?.statusText } };
    }

    const result = await response.json();

    const formattedTeams = result?.map((event: any) => {
      let hostCount = 0;
      let speakerCount = 0;

      event.eventGuests.forEach((guest: any) => {
        if (guest.isHost) hostCount++;
        if (guest.isSpeaker) speakerCount++;
      });

      return {
        uid: event.uid,
        name: event.name,
        hosts: hostCount,
        speakers: speakerCount,
        total: hostCount + speakerCount,
        logo: event.logo?.url,
      };
    }).sort((a: any, b: any) => b.total - a.total);

    const filteredTeams = formattedTeams.filter((item: any) => item.uid !== EVENTS_TEAM_UID);    
    return {
      teams: filteredTeams,
    };
  } catch (error) {
    console.error('Error fetching event contributors:', error);
    return { error: { message: 'Failed to fetch event contributors' } };
  }
}

export const getGuestDetail = async () => {
  const url = `${process.env.DIRECTORY_API_URL}/v1/irl/guests`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeader(""),
    });

    if (!response?.ok) {
      return { error: { statusText: response?.statusText } };
    }

    const result = await response.json();
    const memberMap = new Map();
    result.forEach((item: any) => {
      if (!item.memberUid || !item.member) return;

      const isContributor = item.isHost || item.isSpeaker || 
        (item.events?.some((event: { isHost: any; isSpeaker: any; }) => event.isHost || event.isSpeaker));
      
      if (!isContributor) return;
      
      const memberUid = item.memberUid;
      const member = memberMap.get(memberUid);
      
      if (!member) {
        memberMap.set(memberUid, {
          memberUid,
          member: {
            name: item.member.name,
            image: item.member.image,
            uid: item.member.uid || memberUid
          },
          isHost: !!item.isHost,
          isSpeaker: !!item.isSpeaker,
          events: item.events || []
        });
      } else {
        member.isHost = member.isHost || !!item.isHost;
        member.isSpeaker = member.isSpeaker || !!item.isSpeaker;
        
        if (item.events?.length) {
          const existingEventIds = new Set(member.events.map((e: any) => e.uid));
          member.events.push(...item.events.filter((e: any) => !existingEventIds.has(e.uid)));
        }
      }
    });
    
    const sortedMembers = Array.from(memberMap.values()).sort((a: any, b: any) => {
      const aHasImage = Boolean(a.member?.image?.url);
      const bHasImage = Boolean(b.member?.image?.url);
      
      if (aHasImage && !bHasImage) return -1;
      if (!aHasImage && bHasImage) return 1;
    
      const aName = a.member?.name || '';
      const bName = b.member?.name || '';
      return aName.localeCompare(bName);
    });
    
    
    return { data: sortedMembers };
  } catch (error) {
    console.error('Error fetching guest detail:', error);
    return { error: { message: 'Failed to fetch guest detail' } };
  }
}