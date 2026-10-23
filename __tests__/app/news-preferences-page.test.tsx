const mockNotFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
const mockRedirect = jest.fn((_url: string) => {
  throw new Error('NEXT_REDIRECT');
});
jest.mock('next/navigation', () => ({ notFound: () => mockNotFound(), redirect: (url: string) => mockRedirect(url) }));

let mockShowNewsPreferences = false;
jest.mock('@/utils/news-categories', () => ({
  ...jest.requireActual('@/utils/news-categories'),
  get SHOW_NEWS_PREFERENCES() {
    return mockShowNewsPreferences;
  },
}));

const mockCookies = jest.fn();
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: () => mockCookies() }));
jest.mock('@/components/page/settings/SettingsMenu', () => ({ SettingsMenu: () => null }));
jest.mock('@/components/page/settings/settings-back-btn', () => () => null);
jest.mock('@/components/page/news-preferences', () => ({
  NewsPreferences: () => null,
  buildTeamSignals: () => [],
  pickSignalTeamUids: () => [],
}));
jest.mock('@/services/members.service', () => ({ getMemberInfo: jest.fn() }));
jest.mock('@/services/preferences.service', () => ({ getMemberPreferences: jest.fn() }));
jest.mock('@/services/teams.service', () => ({ getTeam: jest.fn() }));

import NewsPreferencesPage from '@/app/settings/news-preferences/page';

const searchParams = Promise.resolve({ from: 'digest' });

beforeEach(() => {
  jest.clearAllMocks();
  mockCookies.mockResolvedValue({ isLoggedIn: false, userInfo: {}, authToken: '' });
});

describe('News preferences page behind its flag', () => {
  it('is a 404 while the flag is off, before any auth or data read', async () => {
    mockShowNewsPreferences = false;

    await expect(NewsPreferencesPage({ searchParams })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mockNotFound).toHaveBeenCalledTimes(1);
    expect(mockCookies).not.toHaveBeenCalled();
  });

  it('serves the page when the flag is on (a guest goes to sign in)', async () => {
    mockShowNewsPreferences = true;

    await expect(NewsPreferencesPage({ searchParams })).rejects.toThrow('NEXT_REDIRECT');
    expect(mockNotFound).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('returnTo=settings-news-preferences'));
  });
});
