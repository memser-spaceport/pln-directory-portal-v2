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

type SitemapEntity = { uid: string; lastModified?: Date };

function toLastModified(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseEntities(items: unknown[]): SitemapEntity[] {
  const entities: SitemapEntity[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || typeof (item as { uid?: unknown }).uid !== 'string') {
      continue;
    }
    const uid = (item as { uid: string }).uid;
    const lastModified = toLastModified((item as { updatedAt?: unknown }).updatedAt);
    entities.push(lastModified ? { uid, lastModified } : { uid });
  }
  return entities;
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  }
}

async function fetchEntities(path: string, listKey: string): Promise<SitemapEntity[]> {
  const apiBase = process.env.DIRECTORY_API_URL;
  if (!apiBase) {
    return [];
  }

  const withDates = await fetchJson(`${apiBase}${path}?pagination=false&select=uid,updatedAt`);
  const withDatesItems = (withDates as { [key: string]: unknown } | null)?.[listKey];
  if (Array.isArray(withDatesItems)) {
    return parseEntities(withDatesItems);
  }

  const fallback = await fetchJson(`${apiBase}${path}?pagination=false&select=uid`);
  const fallbackItems = (fallback as { [key: string]: unknown } | null)?.[listKey];
  if (!Array.isArray(fallbackItems)) {
    return [];
  }
  return parseEntities(fallbackItems);
}

async function fetchJobCrawlIndex(): Promise<SitemapEntity[]> {
  const apiBase = process.env.DIRECTORY_API_URL;
  if (!apiBase) {
    return [];
  }

  const data = await fetchJson(`${apiBase}/v1/job-openings/crawl-index`);
  const jobs = (data as { jobs?: unknown } | null)?.jobs;
  if (!Array.isArray(jobs)) {
    return [];
  }
  return parseEntities(jobs);
}

function entityEntries(
  entities: SitemapEntity[],
  pathPrefix: string,
  baseUrl: string,
  priority: number,
): MetadataRoute.Sitemap {
  return entities.map((entity) => ({
    url: `${baseUrl}${pathPrefix}/${entity.uid}`,
    changeFrequency: 'weekly',
    priority,
    ...(entity.lastModified ? { lastModified: entity.lastModified } : {}),
  }));
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

  const [teams, members, projects, jobs] = await Promise.all([
    fetchEntities('/v1/teams', 'teams'),
    fetchEntities('/v1/members', 'members'),
    fetchEntities('/v1/projects', 'projects'),
    fetchJobCrawlIndex(),
  ]);

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${baseUrl}${jobOpeningPath(job.uid)}`,
    changeFrequency: 'daily',
    priority: 0.7,
    ...(job.lastModified ? { lastModified: job.lastModified } : {}),
  }));

  return [
    ...staticEntries,
    ...jobEntries,
    ...entityEntries(teams, PAGE_ROUTES.TEAMS, baseUrl, 0.6),
    ...entityEntries(members, PAGE_ROUTES.MEMBERS, baseUrl, 0.5),
    ...entityEntries(projects, PAGE_ROUTES.PROJECTS, baseUrl, 0.5),
  ];
}
