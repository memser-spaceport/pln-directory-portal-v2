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
const mockNewsPreferences = jest.fn((_props: unknown) => null);
jest.mock('@/components/page/news-preferences', () => ({
  NewsPreferences: (props: unknown) => mockNewsPreferences(props),
}));
const mockGetMemberPreferences = jest.fn();
jest.mock('@/services/preferences.service', () => ({
  getMemberPreferences: (...a: unknown[]) => mockGetMemberPreferences(...a),
}));

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

describe('News preferences page data (LAB-3000)', () => {
  beforeEach(() => {
    mockShowNewsPreferences = true;
    mockCookies.mockResolvedValue({ isLoggedIn: true, userInfo: { uid: 'm1', roles: [] }, authToken: 'token' });
  });

  const propsOf = (element: any) => element.props.children[1].props.children[1].props.children.props;

  it("passes the member's tags and the seeded marker to the page", async () => {
    mockGetMemberPreferences.mockResolvedValue({ newsTags: ['desci'], newsTagsSeeded: true });

    const page = await NewsPreferencesPage({ searchParams });

    expect(propsOf(page)).toMatchObject({ uid: 'm1', from: 'digest', initialTags: ['desci'], initialTagsSeeded: true });
  });

  it('starts with no tags when the preferences read fails', async () => {
    mockGetMemberPreferences.mockResolvedValue({ isError: true });

    const page = await NewsPreferencesPage({ searchParams });

    expect(propsOf(page)).toMatchObject({ initialTags: [], initialTagsSeeded: false });
  });
});
