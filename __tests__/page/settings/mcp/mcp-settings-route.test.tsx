const mockRedirect = jest.fn(() => {
  throw new Error('NEXT_REDIRECT');
});
const mockNotFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/settings/mcp',
  useSearchParams: () => new URLSearchParams(),
}));

let mockLoggedIn = false;
jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: async () => ({ isLoggedIn: mockLoggedIn, userInfo: { uid: 'm1', roles: [] } }),
}));

jest.mock('@/utils/mcp', () => ({ SHOW_MCP_CONNECTIONS_PAGE: true }));
jest.mock('@/components/page/settings/SettingsMenu', () => ({ SettingsMenu: () => null }));
jest.mock('@/components/page/settings/settings-back-btn', () => () => null);
jest.mock('@/components/page/settings/mcp', () => ({ McpConnectionsPage: () => null }));

import McpSettingsPage from '@/app/settings/mcp/page';

describe('/settings/mcp signed out', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sends the visitor to login on /home, keeping the access request and returnTo', async () => {
    await expect(McpSettingsPage({ searchParams: Promise.resolve({ request: 'req-1' }) })).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(mockRedirect).toHaveBeenCalledWith('/home?request=req-1&returnTo=settings-mcp#login');
  });

  it('works without a query too', async () => {
    await expect(McpSettingsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith('/home?returnTo=settings-mcp#login');
  });
});
