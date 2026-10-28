import { renderHook } from '@testing-library/react';

import { useGetMenuItems } from '@/components/page/settings/SettingsMenu/hooks/useGetMenuItems';
import type { IUserInfo } from '@/types/shared.types';

const mockSettings = jest.fn();

jest.mock('@/services/members/hooks/useMemberNotificationsSettings', () => ({
  useMemberNotificationsSettings: (uid: string | undefined) => mockSettings(uid),
}));

let mockShowNewsPreferences = true;
jest.mock('@/utils/news-categories', () => ({
  ...jest.requireActual('@/utils/news-categories'),
  get SHOW_NEWS_PREFERENCES() {
    return mockShowNewsPreferences;
  },
}));

let mockShowMcpPage = false;
jest.mock('@/utils/mcp', () => ({
  get SHOW_MCP_CONNECTIONS_PAGE() {
    return mockShowMcpPage;
  },
}));

let mockCanConnect = false;
jest.mock('@/services/rbac/hooks/useMcpAccess', () => ({
  useMcpAccess: () => ({ canConnect: mockCanConnect, isLoading: false, isError: false }),
}));

const userInfo = { uid: 'm1', name: 'Mira Chen' } as IUserInfo;

const names = (items: Array<{ name: string }>) => items.map((item) => item.name);

beforeEach(() => {
  mockShowNewsPreferences = true;
  mockShowMcpPage = false;
  mockCanConnect = false;
  mockSettings.mockReturnValue({ data: { recommendationsEnabled: false } });
});

describe('useGetMenuItems', () => {
  it('asks for the settings of the member whose menu it is', () => {
    renderHook(() => useGetMenuItems(userInfo));

    expect(mockSettings).toHaveBeenCalledWith('m1');
  });

  it('hides "recommendations" when the member does not have it enabled', () => {
    const { result } = renderHook(() => useGetMenuItems(userInfo));

    expect(names(result.current.preferences)).toEqual([
      'notification preferences',
      'news preferences',
      'job preferences',
      'general preferences',
    ]);
  });

  it('slots "recommendations" between the notification and job preferences when enabled', () => {
    mockSettings.mockReturnValue({ data: { recommendationsEnabled: true } });

    const { result } = renderHook(() => useGetMenuItems(userInfo));

    expect(names(result.current.preferences)).toEqual([
      'notification preferences',
      'news preferences',
      'recommendations',
      'job preferences',
      'general preferences',
    ]);
  });

  it('leaves "news preferences" out while the page is flagged off', () => {
    mockShowNewsPreferences = false;
    mockSettings.mockReturnValue({ data: { recommendationsEnabled: true } });

    const { result } = renderHook(() => useGetMenuItems(userInfo));

    expect(names(result.current.preferences)).toEqual([
      'notification preferences',
      'recommendations',
      'job preferences',
      'general preferences',
    ]);
  });

  it('hides "recommendations" while the settings are still loading', () => {
    mockSettings.mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useGetMenuItems(userInfo));

    expect(names(result.current.preferences)).not.toContain('recommendations');
  });

  it('carries the account, team-admin and app-admin groups regardless of settings', () => {
    const { result } = renderHook(() => useGetMenuItems(userInfo));

    expect(result.current.account).toEqual([
      expect.objectContaining({ name: 'email & accounts', url: '/settings/accounts' }),
    ]);
    expect(result.current.teamAdminSettings).toEqual([
      expect.objectContaining({ name: 'manage teams', url: '/settings/teams' }),
    ]);
    expect(result.current.appAdminSettings).toEqual([
      expect.objectContaining({ name: 'manage members', url: '/settings/members' }),
    ]);
  });

  it('gives every item a route and both icon states, so no row renders bare', () => {
    mockSettings.mockReturnValue({ data: { recommendationsEnabled: true } });

    const { result } = renderHook(() => useGetMenuItems(userInfo));
    const all = Object.values(result.current).flat();

    expect(all).toHaveLength(8);
    all.forEach((item) => {
      expect(item.url).toMatch(/^\/settings\//);
      expect(item.icon).toMatch(/^\/icons\/.+\.svg$/);
      expect(item.activeIcon).toMatch(/^\/icons\/.+\.svg$/);
      expect(item.activeIcon).not.toBe(item.icon);
    });
  });

  it('keeps the same object across re-renders while the flag is unchanged', () => {
    const { result, rerender } = renderHook(() => useGetMenuItems(userInfo));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('rebuilds the menu once the flag flips', () => {
    const { result, rerender } = renderHook(() => useGetMenuItems(userInfo));
    const before = result.current;

    mockSettings.mockReturnValue({ data: { recommendationsEnabled: true } });
    rerender();

    expect(result.current).not.toBe(before);
    expect(names(result.current.preferences)).toContain('recommendations');
  });

  describe('MCP connections (LAB-2995)', () => {
    it('adds "MCP connections" after email & accounts when the page is on and the member can connect', () => {
      mockShowMcpPage = true;
      mockCanConnect = true;
      const { result } = renderHook(() => useGetMenuItems(userInfo));
      expect(result.current.account).toEqual([
        expect.objectContaining({ name: 'email & accounts', url: '/settings/accounts' }),
        expect.objectContaining({ name: 'MCP connections', url: '/settings/mcp' }),
      ]);
    });

    it.each([
      ['the page is off', false, true],
      ['the member lacks mcp.connect', true, false],
    ])('leaves it out when %s', (_label, page, canConnect) => {
      mockShowMcpPage = page;
      mockCanConnect = canConnect;
      const { result } = renderHook(() => useGetMenuItems(userInfo));
      expect(names(result.current.account)).toEqual(['email & accounts']);
    });
  });
});
