import type { MetadataRoute } from 'next';
import { PAGE_ROUTES } from '@/utils/constants';

const STATIC_PATHS = [
  PAGE_ROUTES.HOME,
  PAGE_ROUTES.TEAMS,
  PAGE_ROUTES.MEMBERS,
  PAGE_ROUTES.PROJECTS,
  PAGE_ROUTES.JOBS,
  PAGE_ROUTES.EVENTS,
];

async function fetchUids(path: string, listKey: string): Promise<string[]> {
  const apiBase = process.env.DIRECTORY_API_URL;
  if (!apiBase) {
    return [];
  }

  try {
    const response = await fetch(`${apiBase}${path}?pagination=false&select=uid`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    const items = data?.[listKey];
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map((item: { uid?: string }) => item?.uid).filter((uid: string | undefined): uid is string => !!uid);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.APPLICATION_BASE_URL ?? '').replace(/\/$/, '');
  if (!baseUrl) {
    return [];
  }

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: 'daily',
    priority: path === PAGE_ROUTES.HOME ? 1 : 0.8,
  }));

  const [teamUids, memberUids, projectUids] = await Promise.all([
    fetchUids('/v1/teams', 'teams'),
    fetchUids('/v1/members', 'members'),
    fetchUids('/v1/projects', 'projects'),
  ]);

  const teamEntries: MetadataRoute.Sitemap = teamUids.map((uid) => ({
    url: `${baseUrl}${PAGE_ROUTES.TEAMS}/${uid}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const memberEntries: MetadataRoute.Sitemap = memberUids.map((uid) => ({
    url: `${baseUrl}${PAGE_ROUTES.MEMBERS}/${uid}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const projectEntries: MetadataRoute.Sitemap = projectUids.map((uid) => ({
    url: `${baseUrl}${PAGE_ROUTES.PROJECTS}/${uid}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticEntries, ...teamEntries, ...memberEntries, ...projectEntries];
}
