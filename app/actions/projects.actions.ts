'use server';

import { revalidateTag } from 'next/cache';

const projectsAPI = `${process.env.DIRECTORY_API_URL}/v1/projects`;

export const removeContributingTeamFromProject = async (
  projectUid: string,
  teamUid: string,
  authToken: string,
) => {
  try {
    // Fetch the current project data with all relations needed for a safe update
    const getResponse = await fetch(
      `${projectsAPI}/${projectUid}?with=contributingTeams,contributions`,
      { method: 'GET', cache: 'no-store' },
    );

    if (!getResponse.ok) {
      return { isError: true, errorMessage: 'Failed to fetch project data' };
    }

    const projectData = await getResponse.json();

    // Remove the team from contributingTeams
    const updatedContributingTeams = (projectData.contributingTeams || [])
      .filter((ct: any) => ct.uid !== teamUid)
      .map((ct: any) => ({ uid: ct.uid, name: ct.name }));

    // Update the project with only the fields the API expects
    const updateResponse = await fetch(`${projectsAPI}/${projectUid}`, {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: projectData.name,
        tagline: projectData.tagline,
        description: projectData.description,
        lookingForFunding: projectData.lookingForFunding,
        readMe: projectData.readMe,
        maintainingTeamUid: projectData.maintainingTeamUid,
        tags: projectData.tags,
        contactEmail: projectData.contactEmail || null,
        kpis: projectData.kpis,
        logoUid: projectData.logo?.uid || null,
        projectLinks: projectData.projectLinks,
        contributingTeams: updatedContributingTeams,
        contributions: projectData.contributions?.map((c: any) => ({
          memberUid: c.member?.uid ?? c.memberUid,
          uid: c.uid,
        })) ?? [],
        focusAreas: projectData.projectFocusAreas ?? [],
      }),
    });

    if (!updateResponse.ok) {
      return { isError: true, errorMessage: 'Failed to update project' };
    }

    revalidateTag('team-detail');
    revalidateTag('project-detail');

    return { success: true };
  } catch (error) {
    console.error('Error removing contributing team from project:', error);
    return { isError: true, errorMessage: 'Failed to remove project' };
  }
};

export const addContributingTeamToProject = async (
  projectUid: string,
  team: { uid: string; name: string },
  authToken: string,
) => {
  try {
    const getResponse = await fetch(
      `${projectsAPI}/${projectUid}?with=contributingTeams,contributions`,
      { method: 'GET', cache: 'no-store' },
    );

    if (!getResponse.ok) {
      return { isError: true, errorMessage: 'Failed to fetch project data' };
    }

    const projectData = await getResponse.json();

    const existingTeams = (projectData.contributingTeams || [])
      .map((ct: any) => ({ uid: ct.uid, name: ct.name }));

    // Avoid duplicates
    if (existingTeams.some((ct: any) => ct.uid === team.uid)) {
      return { success: true };
    }

    const updatedContributingTeams = [...existingTeams, { uid: team.uid, name: team.name }];

    const updateResponse = await fetch(`${projectsAPI}/${projectUid}`, {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: projectData.name,
        tagline: projectData.tagline,
        description: projectData.description,
        lookingForFunding: projectData.lookingForFunding,
        readMe: projectData.readMe,
        maintainingTeamUid: projectData.maintainingTeamUid,
        tags: projectData.tags,
        contactEmail: projectData.contactEmail || null,
        kpis: projectData.kpis,
        logoUid: projectData.logo?.uid || null,
        projectLinks: projectData.projectLinks,
        contributingTeams: updatedContributingTeams,
        contributions: projectData.contributions?.map((c: any) => ({
          memberUid: c.member?.uid ?? c.memberUid,
          uid: c.uid,
        })) ?? [],
        focusAreas: projectData.projectFocusAreas ?? [],
      }),
    });

    if (!updateResponse.ok) {
      return { isError: true, errorMessage: 'Failed to update project' };
    }

    revalidateTag('team-detail');
    revalidateTag('project-detail');

    return { success: true };
  } catch (error) {
    console.error('Error adding contributing team to project:', error);
    return { isError: true, errorMessage: 'Failed to add team to project' };
  }
};

export const getAllProjects = async (queryParams: any, currentPage: number, limit = 0) => {
  const requestOptions: RequestInit = { method: 'GET', cache: 'force-cache', next: { tags: ['project-list'] } };
  const response = await fetch(
    `${process.env.DIRECTORY_API_URL}/v1/projects?page=${currentPage}&limit=${limit}&${new URLSearchParams(queryParams)}`,
    requestOptions,
  );
  const result = await response.json();
  if (!response?.ok) {
    return { error: { statusText: response?.statusText } };
  }
  const formattedData = result?.projects?.map((project: any) => {
    return {
      id: project?.uid,
      name: project?.name,
      logo: project?.logo?.url,
      description: project?.description,
      maintainingTeam: project?.maintainingTeam,
      lookingForFunding: project?.lookingForFunding,
      tagline: project?.tagline,
      tags: project?.tags ?? [],
    };
  });
  return { data: { formattedData, totalProjects: result?.count } };
};
