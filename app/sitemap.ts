import { getMembersUid } from "@/services/members.service";
import { MetadataRoute } from "next";

const getSiteMapData = async () => {
  let memberRoutes: any[] = [];
  let isError = false;

  try {
    const memberResponse = await getMembersUid();
    memberRoutes = memberResponse?.data?.members?.map((member: any) => {
        return     {
            url: `${process.env.APPLICATION_BASE_URL}/members/${member.uid}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
          }
    });    
    return { isError, memberRoutes };
  } catch (error) {
    return { isError: true };
  }
};

export default async function sitemap():Promise<MetadataRoute.Sitemap> {
    
  const { memberRoutes = [] } = await getSiteMapData();
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
  ];

  return routes;
}