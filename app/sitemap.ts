import type { MetadataRoute } from 'next';
import { DEMO_DAY_PATH, EVENTS_LIST_PATH, PAGE_ROUTES } from '@/utils/constants';
import { jobOpeningPath } from '@/services/jobs/job-detail-link';
import { getApplicationBaseUrl } from '@/utils/seo';

const STATIC_PATHS = [
  PAGE_ROUTES.HOME,
  PAGE_ROUTES.TEAMS,
  PAGE_ROUTES.MEMBERS,
  PAGE_ROUTES.PROJECTS,
  PAGE_ROUTES.JOBS,
  EVENTS_LIST_PATH,
  DEMO_DAY_PATH,
];

type SitemapEntity = { uid: string; lastModified?: Date };

function toLastModified(value: unknown): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** `dateKey` names the field that dates the page: `updatedAt` for profiles, `lastModified` for jobs. */
function parseEntities(items: unknown[], dateKey = 'updatedAt'): SitemapEntity[] {
  const entities: SitemapEntity[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object' || typeof (item as { uid?: unknown }).uid !== 'string') {
      continue;
    }
    const uid = (item as { uid: string }).uid;
    const lastModified = toLastModified((item as Record<string, unknown>)[dateKey]);
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
  // The posting's own date (LAB-3094). Its `updatedAt` is the nightly sync, so a job without `lastModified` gets no
  // lastmod rather than that.
  return parseEntities(jobs, 'lastModified');
}

/**
 * Teams a logged-out visitor can open (LAB-3087). The full list included the `L0` teams, which the API refuses to a
 * logged-out visitor: 931 sitemap URLs that each rendered an error page. Until the API serves the crawl index, the
 * full list stands in, so the sitemap never loses its teams.
 */
async function fetchTeamCrawlIndex(): Promise<SitemapEntity[]> {
  const apiBase = process.env.DIRECTORY_API_URL;
  if (!apiBase) {
    return [];
  }

  const data = await fetchJson(`${apiBase}/v1/teams/crawl-index`);
  const teams = (data as { teams?: unknown } | null)?.teams;
  if (Array.isArray(teams)) {
    return parseEntities(teams);
  }
  return fetchEntities('/v1/teams', 'teams');
}

// No changefreq or priority anywhere (LAB-3094): Google ignores both. lastmod is the one field it reads.
function entityEntries(entities: SitemapEntity[], pathPrefix: string, baseUrl: string): MetadataRoute.Sitemap {
  return entities.map((entity) => ({
    url: `${baseUrl}${pathPrefix}/${entity.uid}`,
    ...(entity.lastModified ? { lastModified: entity.lastModified } : {}),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getApplicationBaseUrl();
  if (!baseUrl) {
    return [];
  }

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({ url: `${baseUrl}${path}` }));

  const [teams, members, projects, jobs] = await Promise.all([
    fetchTeamCrawlIndex(),
    fetchEntities('/v1/members', 'members'),
    fetchEntities('/v1/projects', 'projects'),
    fetchJobCrawlIndex(),
  ]);

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${baseUrl}${jobOpeningPath(job.uid)}`,
    ...(job.lastModified ? { lastModified: job.lastModified } : {}),
  }));

  return [
    ...staticEntries,
    ...jobEntries,
    ...entityEntries(teams, PAGE_ROUTES.TEAMS, baseUrl),
    ...entityEntries(members, PAGE_ROUTES.MEMBERS, baseUrl),
    ...entityEntries(projects, PAGE_ROUTES.PROJECTS, baseUrl),
  ];
}
