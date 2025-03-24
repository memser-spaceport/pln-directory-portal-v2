"use server"
import { getHeader } from "@/utils/common.utils";
import { getFormattedEvents, getFormattedLocations } from "@/utils/home.utils";

export const getAggregatedEventsData = async (authToken?: any, isLoggedIn?: boolean, isAdmin?: boolean) => {
    let url = `${process.env.DIRECTORY_API_URL}/v1/aggregate`;

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
  let url = `${process.env.DIRECTORY_API_URL}/v1/aggregated/events/contributors`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeader(""),
    });

    if (!response?.ok) {
      return { error: { statusText: response?.statusText } };
    }

    const result = await response.json();

    const formattedMembers = result?.flatMap((item: any) => 
      item?.eventGuests?.map((guest: any) => guest.member)
    );

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

    return {
      members: formattedMembers,
      teams: formattedTeams,
    };
  } catch (error) {
    console.error('Error fetching event contributors:', error);
    return { error: { message: 'Failed to fetch event contributors' } };
  }
}