import { IMember, IMemberPreferences, IMemberResponse, ITeamMemberRole } from "@/types/members.types";

export const parseMemberDetails = (members: IMemberResponse[], teamId: string, isLoggedIn: boolean) => {
    return members?.map((member: IMemberResponse): IMember => {
      let parsedMember = { ...member };
      if (teamId) {
        parsedMember = {
          ...member,
          teamMemberRoles: member.teamMemberRoles?.filter((teamMemberRole: ITeamMemberRole) => teamMemberRole.team?.uid === teamId),
        };
      }
      const teams =
        parsedMember.teamMemberRoles?.map((teamMemberRole: ITeamMemberRole) => ({
          id: teamMemberRole.team?.uid || "",
          name: teamMemberRole.team?.name || "",
          role: teamMemberRole.role || "Contributor",
          teamLead: !!teamMemberRole.teamLead,
          mainTeam: !!teamMemberRole.mainTeam,
        })) || [];
      const mainTeam = teams.find((team) => team.mainTeam);
      const teamLead = teams.some((team) => team.teamLead);
  
      const data: any = {
        id: parsedMember.uid,
        name: parsedMember.name,
        profile: parsedMember.image?.url || null,
        officeHours: parsedMember.officeHours || null,
        skills: parsedMember.skills || [],
        teamLead,
        projectContributions: parsedMember.projectContributions ?? null,
        teams,
        location: parsedMember?.location,
        mainTeam,
        openToWork: parsedMember.openToWork || false,
        preferences: parsedMember.preferences ?? null,
      };
  
      if (!isLoggedIn) {
        return {
          ...data,
          email: null,
          githubHandle: null,
          discordHandle: null,
          telegramHandle: null,
          twitter: null,
          linkedinHandle: null,
          repositories: [],
        };
      }
      return data;
    });
  };


  export const hidePreferences = (preferences: IMemberPreferences, member: IMember) => {
    if (!preferences?.showEmail) {
      delete member['email'];
    }
    if (!preferences?.showDiscord) {
      delete member['discordHandle'];
    }
    if (!preferences?.showGithubHandle) {
      delete member['githubHandle'];
    }
    if (!preferences?.showTelegram) {
      delete member['telegramHandle'];
    }
    if (!preferences?.showLinkedin) {
      delete member['linkedinHandle'];
    }
    if (!preferences?.showGithubProjects) {
      delete member['repositories'];
    }
    if (!preferences?.showTwitter) {
      delete member['twitter'];
    }
  }

  export const parseMemberLocation = (location: any) => {
    const { metroArea, city, country, region } = location ?? {};
    if (metroArea) {
      return metroArea;
    }
    if (country) {
      if (city) {
        return `${city}, ${country}`;
      }
      if (region) {
        return `${region}, ${country}`;
      }
      return country;
    }
  
    return "Not provided";
  };

  export const formatDate = (dateString: string) => {
    const month = new Date(dateString).toLocaleDateString(undefined, { month: "short" });
    const year = new Date(dateString).getFullYear();
    return `${month} ${year}`;
  };
  
  export const dateDifference = (date1: any, date2: any) => {
    const timeDifference = Math.abs(date1 - date2);
    const monthsBetween = (date1: any, date2: any) => {
      return (date2.getFullYear() - date1.getFullYear()) * 12 + date2.getMonth() - date1.getMonth();
    };
  
    const secondsDifference = Math.floor(timeDifference / 1000);
    const minutesDifference = Math.floor(secondsDifference / 60);
    const hoursDifference = Math.floor(minutesDifference / 60);
    const daysDifference = Math.floor(hoursDifference / 24);
    const monthsDifference = monthsBetween(date1, date2);
    const yearsDifference = Math.floor(monthsDifference / 12);
  
    if (yearsDifference >= 1) {
      if (monthsDifference % 12 !== 0) {
        return `${yearsDifference} years and ${monthsDifference % 12} months`;
      } else if (yearsDifference === 1) {
        return `${yearsDifference} year`;
      } else {
        return `${yearsDifference} years`;
      }
    } else if (monthsDifference === 1) {
      return `${monthsDifference} month`;
    } else if (monthsDifference > 1) {
      return `${monthsDifference} months`;
    } else if (daysDifference === 1) {
      return `${daysDifference} day`;
    } else if (daysDifference > 1) {
      return `${daysDifference} days`;
    } else if (hoursDifference >= 1) {
      return `${hoursDifference} hours`;
    } else if (minutesDifference >= 1) {
      return `${minutesDifference} minutes`;
    } else {
      return `${secondsDifference} seconds`;
    }
  };