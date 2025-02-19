"use server"
import { getHeader } from "@/utils/common.utils";
import { getFormattedEvents, getFormattedLocations, getformattedMembers, getFormattedProjects, getFormattedTeams } from "@/utils/home.utils";

export const getFeaturedData = async (authToken: any, isLoggedIn: boolean, isAdmin: boolean) => {
    let url = `${process.env.DIRECTORY_API_URL}/v1/home/featured`;

    const response = await fetch(url, {
      method: 'GET',
      cache: 'force-cache',
      next: { tags: ['featured'] },
      headers: getHeader(authToken),
    });
  
    const result = await response.json();
  
    const formattedMembers = getformattedMembers(result?.members?.members || []);
    const formattedTeams = getFormattedTeams(result?.teams?.teams || []);
    const formattedEvents = getFormattedEvents(result?.events || []);
    const formattedProjects = getFormattedProjects(result.projects?.projects || []);
    let formattedLocations = getFormattedLocations(result?.locations || [])

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
    
    const maxLength = Math.max(formattedMembers.length, formattedTeams.length, formattedEvents.length, formattedProjects.length);
  
    const combinedData = [];
    for (let i = 0; i < maxLength; i++) {
      if (formattedEvents[i] !== undefined) combinedData.push(formattedEvents[i]);
      if (formattedMembers[i] !== undefined) combinedData.push(formattedMembers[i]);
      if (formattedTeams[i] !== undefined) combinedData.push(formattedTeams[i]);
      if (formattedProjects[i] !== undefined) combinedData.push(formattedProjects[i]);
      if (formattedLocations[i] !== undefined) combinedData.push(formattedLocations[i]);
    }
  
    if (!response?.ok) {
      return { error: { statusText: response?.statusText } };
    }
    return { data: combinedData };
  };