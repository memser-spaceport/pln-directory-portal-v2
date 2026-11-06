import {
  levelChanges,
  scopeChips,
  scopeOptions,
  templateLevels,
  templateOf,
} from '@/components/page/settings/mcp/mcpPermissions';
import type { McpConnectionScope } from '@/services/mcp/types';

const scope = (overrides: Partial<McpConnectionScope> & Pick<McpConnectionScope, 'key'>): McpConnectionScope => ({
  label: overrides.key,
  level: 'read',
  maxLevel: 'read',
  registryMax: 'read',
  lock: null,
  ...overrides,
});

const SCOPES: McpConnectionScope[] = [
  scope({ key: 'search' }),
  scope({ key: 'forum', maxLevel: 'none', lock: 'admin' }),
  scope({ key: 'investors', maxLevel: 'write', registryMax: 'write' }),
  scope({ key: 'ai_apps', maxLevel: 'read', registryMax: 'write', lock: 'admin' }),
];

describe('MCP permission helpers', () => {
  it('builds templates within each scope maximum', () => {
    expect(templateLevels('read', SCOPES)).toEqual({
      search: 'read',
      forum: 'none',
      investors: 'read',
      ai_apps: 'read',
    });
    expect(templateLevels('write', SCOPES)).toEqual({
      search: 'read',
      forum: 'none',
      investors: 'write',
      ai_apps: 'read',
    });
  });

  it('reads the template from the rows, Custom otherwise', () => {
    expect(templateOf({ search: 'read', forum: 'none', investors: 'read', ai_apps: 'read' }, SCOPES)).toBe('read');
    expect(templateOf({ search: 'read', forum: 'none', investors: 'write', ai_apps: 'read' }, SCOPES)).toBe('write');
    expect(templateOf({ search: 'none', forum: 'none', investors: 'read', ai_apps: 'read' }, SCOPES)).toBe('custom');
  });

  it('offers write only for scopes with write tools, disabled above the maximum', () => {
    expect(scopeOptions(SCOPES[0])).toEqual([
      { level: 'none', disabled: false },
      { level: 'read', disabled: false },
    ]);
    expect(scopeOptions(SCOPES[1])).toEqual([
      { level: 'none', disabled: false },
      { level: 'read', disabled: true },
    ]);
    expect(scopeOptions(SCOPES[3])).toEqual([
      { level: 'none', disabled: false },
      { level: 'read', disabled: false },
      { level: 'write', disabled: true },
    ]);
  });

  it('offers write for profile when the server allows it', () => {
    expect(scopeOptions(scope({ key: 'profile', maxLevel: 'write', registryMax: 'write' }))).toEqual([
      { level: 'none', disabled: false },
      { level: 'read', disabled: false },
      { level: 'write', disabled: false },
    ]);
  });

  it('lists only changed scopes', () => {
    const saved = { search: 'read', investors: 'read' } as const;
    expect(levelChanges(saved, { search: 'read', investors: 'write' }, SCOPES)).toEqual([
      { scope: 'investors', from: 'read', to: 'write' },
    ]);
  });

  it('shows one template chip, or one chip per reachable scope', () => {
    expect(scopeChips({ scopes: SCOPES.map((s) => ({ ...s, level: s.key === 'forum' ? 'none' : 'read' })) })).toEqual({
      kind: 'template',
      label: 'Read only (default)',
    });
    expect(
      scopeChips({
        scopes: [
          scope({ key: 'search', level: 'none' }),
          scope({ key: 'investors', level: 'write', maxLevel: 'write', registryMax: 'write' }),
          scope({ key: 'ai_apps', level: 'read', maxLevel: 'write', registryMax: 'write' }),
        ],
      }),
    ).toEqual({ kind: 'list', chips: ['investors:write', 'ai_apps:read'] });
  });
});
