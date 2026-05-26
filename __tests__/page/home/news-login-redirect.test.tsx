import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import { NewsLoginRedirect } from '@/components/page/home/TeamNews/NewsLoginRedirect';
import { NEWS_JOIN_DISCUSSION_PENDING_KEY } from '@/components/page/home/TeamNews/components/NewsCard/StartConversationButton';

const mockPush = jest.fn();
const mockUseCurrentUserStore = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => mockUseCurrentUserStore(),
}));

describe('NewsLoginRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    try {
      window.sessionStorage.clear();
    } catch {
      /* noop */
    }
  });

  it('does nothing while auth state is unhydrated', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: false });
    window.sessionStorage.setItem(NEWS_JOIN_DISCUSSION_PENDING_KEY, '/forum/topics/1/42');
    render(<NewsLoginRedirect />);
    expect(mockPush).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(NEWS_JOIN_DISCUSSION_PENDING_KEY)).toBe('/forum/topics/1/42');
  });

  it('does nothing when the user is still signed out', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null, isHydrated: true });
    window.sessionStorage.setItem(NEWS_JOIN_DISCUSSION_PENDING_KEY, '/forum/topics/1/42');
    render(<NewsLoginRedirect />);
    expect(mockPush).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(NEWS_JOIN_DISCUSSION_PENDING_KEY)).toBe('/forum/topics/1/42');
  });

  it('does nothing when there is no stashed target', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'm-1' }, isHydrated: true });
    render(<NewsLoginRedirect />);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('reads the stashed target, clears it, and pushes the user through on login', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { uid: 'm-1' }, isHydrated: true });
    window.sessionStorage.setItem(NEWS_JOIN_DISCUSSION_PENDING_KEY, '/forum/topics/1/42');
    render(<NewsLoginRedirect />);
    expect(mockPush).toHaveBeenCalledWith('/forum/topics/1/42');
    expect(window.sessionStorage.getItem(NEWS_JOIN_DISCUSSION_PENDING_KEY)).toBeNull();
  });
});
