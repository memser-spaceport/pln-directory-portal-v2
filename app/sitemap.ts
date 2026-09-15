import type { MetadataRoute } from 'next';
import { PAGE_ROUTES } from '@/utils/constants';
import { jobOpeningPath } from '@/services/jobs/job-detail-link';
import { getApplicationBaseUrl } from '@/utils/seo';

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

async function fetchJobCrawlIndex(): Promise<{ uid: string; updatedAt: string }[]> {
  const apiBase = process.env.DIRECTORY_API_URL;
  if (!apiBase) {
    return [];
  }

  try {
    const response = await fetch(`${apiBase}/v1/job-openings/crawl-index`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    const jobs = data?.jobs;
    if (!Array.isArray(jobs)) {
      return [];
    }
    return jobs.filter(
      (item: { uid?: string; updatedAt?: string }): item is { uid: string; updatedAt: string } =>
        typeof item?.uid === 'string' && typeof item?.updatedAt === 'string',
    );
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getApplicationBaseUrl();
  if (!baseUrl) {
    return [];
  }

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: 'daily',
    priority: path === PAGE_ROUTES.HOME ? 1 : path === PAGE_ROUTES.JOBS ? 0.9 : 0.8,
  }));

  const [teamUids, memberUids, projectUids, jobs] = await Promise.all([
    fetchUids('/v1/teams', 'teams'),
    fetchUids('/v1/members', 'members'),
    fetchUids('/v1/projects', 'projects'),
    fetchJobCrawlIndex(),
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

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${baseUrl}${jobOpeningPath(job.uid)}`,
    lastModified: job.updatedAt,
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  return [...staticEntries, ...jobEntries, ...teamEntries, ...memberEntries, ...projectEntries];
}
