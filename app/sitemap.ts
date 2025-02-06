import { getLocationsUid } from "@/services/irl.service";
import { getMembersUid } from "@/services/members.service";
import { getProjectsUid } from "@/services/projects.service";
import { getTeamsUid } from "@/services/teams.service";
import { MetadataRoute } from "next";

const getSiteMapData = async () => {
  let memberRoutes: any[] = [];
  let teamRoutes: any[] = [];
  let projectRoutes: any[] = [];
  let irlRoutes: any[] = [];
  let isError = false;

  try {
    const memberResponse = await getMembersUid();
    memberRoutes = memberResponse?.data?.members?.map((member: any) => {
        return {
            url: `${process.env.APPLICATION_BASE_URL}/members/${member.uid}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
          }
    });    

    const teamResponse = await getTeamsUid();
    teamRoutes = teamResponse?.data?.teams?.map((team: any) => {
        return {
            url: `${process.env.APPLICATION_BASE_URL}/teams/${team.uid}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
      }
    })

    const projectResponse = await getProjectsUid();
    projectRoutes = projectResponse?.data?.projects?.map((project: any) => {
        return {
            url: `${process.env.APPLICATION_BASE_URL}/projects/${project.uid}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
      }
    })

    const irlResponse = await getLocationsUid();
    irlRoutes = irlResponse?.data?.map((location: any) => {
        return {
            url: `${process.env.APPLICATION_BASE_URL}/irl?location=${location.country}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
      }
    })

    return { isError, memberRoutes, teamRoutes, projectRoutes, irlRoutes };
  } catch (error) {
    return { isError: true };
  }
};

export default async function sitemap():Promise<MetadataRoute.Sitemap> {
    
  const { memberRoutes = [], teamRoutes = [], projectRoutes = [], irlRoutes = [] } = await getSiteMapData();
  const routes:MetadataRoute.Sitemap = [
    {
      url: `${process.env.APPLICATION_BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${process.env.APPLICATION_BASE_URL}/members`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${process.env.APPLICATION_BASE_URL}/teams`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
    {
      url: `${process.env.APPLICATION_BASE_URL}/projects`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
    {
      url: `${process.env.APPLICATION_BASE_URL}/irl`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...memberRoutes,
    ...teamRoutes,
    ...projectRoutes,
    ...irlRoutes
  ];

  return routes;
}