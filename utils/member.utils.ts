import { IMember, IMemberResponse, ITeamMemberRole } from "@/types/members.types";

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