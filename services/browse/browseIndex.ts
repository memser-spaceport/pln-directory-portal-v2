/**
 * The browse index (LAB-3093): every public team, member and project, A to Z, a page of plain links at a time.
 *
 * The listings show 50 profiles in their server HTML and load the rest as the visitor scrolls, so a crawler following
 * links reached only those 50. These pages reach every profile the sitemap lists, by the same API reads: the full list
 * for members and projects, and for teams the full list narrowed to the crawl index, which leaves out the teams a
 * signed-out visitor cannot open.
 */
import { PAGE_ROUTES } from '@/utils/constants';

export type BrowseKind = 'teams' | 'members' | 'projects';

export type BrowseEntry = { uid: string; name: string };

export const BROWSE_PAGE_SIZE = 200;

export const BROWSE_ROUTES: Record<BrowseKind, string> = {
  teams: PAGE_ROUTES.TEAMS,
  members: PAGE_ROUTES.MEMBERS,
  projects: PAGE_ROUTES.PROJECTS,
};

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

function listOf(data: unknown, key: string): unknown[] | null {
  const items = Array.isArray(data) ? data : (data as Record<string, unknown> | null)?.[key];
  return Array.isArray(items) ? items : null;
}

/** Entries with a uid and a non-blank name, A to Z by name (then uid, so equal names keep one order). */
export function toBrowseEntries(items: unknown[], allowedUids?: Set<string>): BrowseEntry[] {
  const entries: BrowseEntry[] = [];
  for (const item of items) {
    const { uid, name } = (item ?? {}) as { uid?: unknown; name?: unknown };
    if (typeof uid !== 'string' || !uid || typeof name !== 'string' || !name.trim()) continue;
    if (allowedUids && !allowedUids.has(uid)) continue;
    entries.push({ uid, name: name.trim() });
  }
  return entries.sort(
    (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.uid.localeCompare(b.uid),
  );
}

/** Every public profile of a kind, A to Z, or null when the API could not be read. */
export async function loadBrowseEntries(kind: BrowseKind): Promise<BrowseEntry[] | null> {
  const apiBase = process.env.DIRECTORY_API_URL;
  if (!apiBase) return null;

  const items = listOf(await fetchJson(`${apiBase}/v1/${kind}?pagination=false&select=uid,name`), kind);
  if (!items) return null;
  if (kind !== 'teams') return toBrowseEntries(items);

  // Until the API serves the crawl index, the full list stands in, as it does for the sitemap.
  const crawlIndex = listOf(await fetchJson(`${apiBase}/v1/teams/crawl-index`), 'teams');
  const publicUids = crawlIndex
    ? new Set(crawlIndex.map((team) => (team as { uid?: unknown })?.uid).filter((uid): uid is string => !!uid))
    : undefined;
  return toBrowseEntries(items, publicUids);
}

/** The page a `?page=` value asks for: 1 when absent, null when it is not a whole number from 1 up. */
export function parseBrowsePage(raw: string | string[] | undefined): number | null {
  if (raw === undefined) return 1;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

export function browsePageCount(total: number): number {
  return Math.max(1, Math.ceil(total / BROWSE_PAGE_SIZE));
}

export function browsePageItems(entries: BrowseEntry[], page: number): BrowseEntry[] {
  return entries.slice((page - 1) * BROWSE_PAGE_SIZE, page * BROWSE_PAGE_SIZE);
}

/** The address of a browse page; page 1 has no `?page=`, so it has one address. */
export function browsePath(kind: BrowseKind, page = 1): string {
  const base = `${BROWSE_ROUTES[kind]}/browse`;
  return page > 1 ? `${base}?page=${page}` : base;
}
