import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { ForumIntroBanner } from '@/components/page/forum/ForumIntroBanner/ForumIntroBanner';

const mockGetMemberPreferences = jest.fn();
const mockUpdatePreferences = jest.fn();
const mockOnForumBannerDismissed = jest.fn();
const mockGetCookiesFromClient = jest.fn();

jest.mock('@/services/members/hooks/useGetMemberPreferences', () => ({
  useGetMemberPreferences: (...args: unknown[]) => mockGetMemberPreferences(...args),
}));

jest.mock('@/services/members/hooks/useUpdateMemberPreferences', () => ({
  useUpdateMemberPreferences: () => ({ mutate: mockUpdatePreferences }),
}));

jest.mock('@/analytics/forum.analytics', () => ({
  useForumAnalytics: () => ({ onForumBannerDismissed: mockOnForumBannerDismissed }),
}));

jest.mock('@/utils/third-party.helper', () => ({
  getCookiesFromClient: () => mockGetCookiesFromClient(),
}));

const BANNER_COPY = /Every member has been individually vetted/i;

describe('ForumIntroBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCookiesFromClient.mockReturnValue({ userInfo: { uid: 'member-1' } });
  });

  it('renders nothing while preferences are loading', () => {
    mockGetMemberPreferences.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { container } = render(<ForumIntroBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when preferences query errors', () => {
    mockGetMemberPreferences.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    const { container } = render(<ForumIntroBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when showForumBanner is false', () => {
    mockGetMemberPreferences.mockReturnValue({
      data: { memberPreferences: { showForumBanner: false } },
      isLoading: false,
      isError: false,
    });
    const { container } = render(<ForumIntroBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when there is no signed-in user', () => {
    mockGetCookiesFromClient.mockReturnValue({ userInfo: null });
    mockGetMemberPreferences.mockReturnValue({
      data: { memberPreferences: { showForumBanner: true } },
      isLoading: false,
      isError: false,
    });
    const { container } = render(<ForumIntroBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the banner when showForumBanner is true', () => {
    mockGetMemberPreferences.mockReturnValue({
      data: { memberPreferences: { showForumBanner: true } },
      isLoading: false,
      isError: false,
    });
    render(<ForumIntroBanner />);
    expect(screen.getByText(BANNER_COPY)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss forum intro banner/i })).toBeInTheDocument();
  });

  it('dismisses the banner, fires the analytics event, and PATCHes preferences on close click', () => {
    mockGetMemberPreferences.mockReturnValue({
      data: { memberPreferences: { showForumBanner: true } },
      isLoading: false,
      isError: false,
    });
    render(<ForumIntroBanner />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss forum intro banner/i }));

    expect(screen.queryByText(BANNER_COPY)).not.toBeInTheDocument();
    expect(mockOnForumBannerDismissed).toHaveBeenCalledTimes(1);
    expect(mockUpdatePreferences).toHaveBeenCalledWith({
      uid: 'member-1',
      payload: { showForumBanner: false },
    });
  });
});
