import type { McpConnection, McpConnectionScope, McpLevel, McpLevels, McpScopeKey } from '@/services/mcp/types';

/**
 * What each scope lets an agent do, in the member's words. From the LAB-2948 prototype (`mocks.ts` SCOPES), trimmed
 * to what the MCP server exposes today (LAB-2995): no AI Search, no investor refresh tool. Write text shows only when
 * the server says the scope has write tools. A scope the server adds later shows with its server label and no text.
 */
export const SCOPE_COPY: Partial<Record<McpScopeKey, { read: string; write?: string }>> = {
  search: { read: 'Search members, teams, projects and events.' },
  forum: { read: 'Read threads and replies.', write: 'start threads and reply.' },
  news: { read: 'Read Home updates and your For You feed.', write: 'post news for your teams.' },
  directory: {
    read: 'Open profiles, team pages and projects.',
    write: "edit the teams you lead and your teams' projects.",
  },
  events: { read: 'Browse events and who is going.', write: 'RSVP for you.' },
  investors: {
    read: 'Look up investors and your warm-intro paths.',
    write: 'add notes and feedback to your paths, and edit investor records.',
  },
  ai_apps: { read: 'Read feedback on your apps.', write: 'change the status of that feedback.' },
  profile: { read: 'Read your profile.', write: 'edit your profile.' },
};

export const LEVEL_LABEL: Record<McpLevel, string> = { none: 'No access', read: 'Read', write: 'Read and write' };

const RANK: Record<McpLevel, number> = { none: 0, read: 1, write: 2 };

export function levelAtLeast(level: McpLevel, needed: McpLevel): boolean {
  return RANK[level] >= RANK[needed];
}

export function minLevel(a: McpLevel, b: McpLevel): McpLevel {
  return RANK[a] <= RANK[b] ? a : b;
}

export type Template = 'read' | 'write' | 'custom';

export function levelsOf(connection: Pick<McpConnection, 'scopes'>): McpLevels {
  return Object.fromEntries(connection.scopes.map((scope) => [scope.key, scope.level])) as McpLevels;
}

/** The two presets. Read and write stops at each scope's maximum, so capped scopes stay where admins allow. */
export function templateLevels(template: 'read' | 'write', scopes: McpConnectionScope[]): McpLevels {
  return Object.fromEntries(
    scopes.map((scope) => [scope.key, template === 'read' ? minLevel('read', scope.maxLevel) : scope.maxLevel]),
  ) as McpLevels;
}

export function templateOf(levels: McpLevels, scopes: McpConnectionScope[]): Template {
  const same = (other: McpLevels) => scopes.every((scope) => levels[scope.key] === other[scope.key]);
  if (same(templateLevels('read', scopes))) return 'read';
  if (same(templateLevels('write', scopes))) return 'write';
  return 'custom';
}

/** The options a scope row offers: write only when the scope has write tools; options above `maxLevel` disabled. */
export function scopeOptions(scope: McpConnectionScope): Array<{ level: McpLevel; disabled: boolean }> {
  const levels: McpLevel[] = levelAtLeast(scope.registryMax, 'write') ? ['none', 'read', 'write'] : ['none', 'read'];
  return levels.map((level) => ({ level, disabled: !levelAtLeast(scope.maxLevel, level) }));
}

/** The changed scopes between the saved levels and a draft. */
export function levelChanges(saved: McpLevels, draft: McpLevels, scopes: McpConnectionScope[]) {
  return scopes
    .filter((scope) => draft[scope.key] !== undefined && draft[scope.key] !== saved[scope.key])
    .map((scope) => ({ scope: scope.key, from: saved[scope.key] ?? 'read', to: draft[scope.key] as McpLevel }));
}

/**
 * Card chips, as PostHog lists an app's scopes: one chip per scope the connection can reach (`forum:read`), in the
 * server's priority order. A connection on a template reads as one chip instead (Anuj, 2026-10-27).
 */
export function scopeChips(
  connection: Pick<McpConnection, 'scopes'>,
): { kind: 'template'; label: string } | { kind: 'list'; chips: string[] } {
  const levels = levelsOf(connection);
  const template = templateOf(levels, connection.scopes);
  if (template === 'read') return { kind: 'template', label: 'Read only (default)' };
  if (template === 'write') return { kind: 'template', label: 'Read and write' };
  return {
    kind: 'list',
    chips: connection.scopes.filter((scope) => scope.level !== 'none').map((scope) => `${scope.key}:${scope.level}`),
  };
}
