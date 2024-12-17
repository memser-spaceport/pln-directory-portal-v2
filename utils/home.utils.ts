import { IMember, IMemberResponse, ITeamMemberRole } from '@/types/members.types';
import { ITeamResponse } from '@/types/teams.types';

export const getFormattedTeams = (teams: any) => {
  return teams?.map((team: ITeamResponse) => {
    const isNewTeam = isNew(team?.createdAt);

    return {
      id: team?.uid,
      category: 'team',
      isNew: isNewTeam,
      name: team?.name,
      logo: team?.logo?.url,
      shortDescription: team?.shortDescription,
    };
  });
};

export const getFormattedProjects = (projects: any) => {
  return (
    projects?.map((project: any) => {
      const contributors =
        project?.contributions?.map((mem: any) => {
          const { member } = mem;
          return {
            logo: member?.image?.url || null,
            name: member?.name,
            id: member?.uid,
          };
        }) || [];

      const isNewProject = isNew(project?.createdAt);

      return {
        id: project?.uid,
        category: 'project',
        name: project?.name,
        logo: project?.logo?.url,
        isNew: isNewProject,
        description: project?.description,
        // lookingForFunding: project?.lookingForFunding,
        contributors,
      };
    }) || []
  );
};

export const getFormattedEvents = (events: any) => {
  return events?.map((event: any) => {
    return {
      id: event?.uid,
      category: 'event',
      name: event?.name,
      slugUrl: event?.slugURL,
      bannerUrl: event?.banner?.url,
      description: event?.description,
      location: event?.location?.location,
      timezone:  event?.location?.timezone,
      startDate: event?.startDate,
      endDate: event?.endDate,
      createdAt: event?.createdAt,
      type: event?.type,
      attendees: event?.eventGuests?.length,
      priority: event?.priority,
    };
  });
};

export const getformattedMembers = (members: IMemberResponse[]) => {
  return members?.map((member: IMemberResponse): IMember => {
    let parsedMember = { ...member };
    const teams =
      parsedMember.teamMemberRoles?.map((teamMemberRole: ITeamMemberRole) => ({
        id: teamMemberRole.team?.uid || '',
        name: teamMemberRole.team?.name || '',
        role: teamMemberRole.role || 'Contributor',
        teamLead: !!teamMemberRole.teamLead,
        mainTeam: !!teamMemberRole.mainTeam,
      })) || [];
    const mainTeam = teams.find((team) => team.mainTeam);
    const teamLead = teams.some((team) => team.teamLead);

    const isNewMember = isNew(member?.createdAt);

    const data: any = {
      id: parsedMember.uid,
      category: 'member',
      isNew: isNewMember,
      name: parsedMember.name,
      profile: parsedMember.image?.url || null,
      officeHours: parsedMember.officeHours || null,
      skills: parsedMember.skills || [],
      teamLead,
      teams,
      location: parsedMember?.location,
      mainTeam,
      openToWork: parsedMember.openToWork || false,
      bio: parsedMember?.bio?.trim(),
    };

    return data;
  });
};

function isNew(createdAt?: string): boolean {
  if (!createdAt) {
    return false;
  }

  const newDate = new Date(createdAt);
  if (isNaN(newDate.getTime())) {
    return false;
  }
  newDate.setDate(newDate.getDate() + 30);
  return newDate > new Date();
}

export function formatNumber(num: number) {
  if (num >= 1000 && num < 1000000) {
    const rounded = Math.floor(num / 100) / 10;
    return (rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)) + 'k';
  } else if (num >= 1000000 && num < 1000000000) {
    const rounded = Math.floor(num / 100000) / 10;
    return (rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)) + 'M';
  } else if (num >= 1000000000) {
    const rounded = Math.floor(num / 100000000) / 10;
    return (rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)) + 'B';
  }
  return num.toString();
}

export function formatDiscoverData(discoverData: any) {
  const temp = [...discoverData];

  const images = [
    {
      mob: '/images/discover/discover-pattern-2-mob.svg',
      desktop: '/images/discover/discover-pattern-2.svg',
    },
    {
      mob: '/images/discover/discover-pattern-3-mob.svg',
      desktop: '/images/discover/discover-pattern-3.svg',
    },
    {
      mob: '/images/discover/discover-pattern-1-mob.svg',
      desktop: '/images/discover/discover-pattern-1.svg',
    },
  ];

  temp.forEach((item, index) => {
    // Find the correct image using modulo to cycle through the images array
    const image = images[index % images.length];
    // Assign the image to the object
    item.image = image;
  });

  const questionAndAnswers = [...temp, {uid:'discover-husky', type: 'discoverhusky' }];

  return questionAndAnswers;
}