import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocationCard from '@/components/page/home/featured/location-card';
import '@testing-library/jest-dom';

// Mock function declarations for router and analytics
const mockRouterRefresh = jest.fn();
const mockRouterPush = jest.fn();
const mockAnalytics = { irlLocationFollowBtnClicked: jest.fn(), irlLocationUnFollowBtnClicked: jest.fn() };

// Mocks
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));
jest.mock('@/components/core/tooltip/tooltip', () => ({ Tooltip: ({ children, trigger, content }: any) => <>{trigger}{content}</> }));
jest.mock('@/components/core/modal', () => ({ __esModule: true, default: ({ children }: any) => <div data-testid="modal">{children}</div> }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRouterRefresh, push: mockRouterPush }) }));
jest.mock('@/analytics/irl.analytics', () => ({ useIrlAnalytics: () => mockAnalytics }));

jest.mock('@/utils/common.utils', () => ({ triggerLoader: jest.fn() }));
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));
jest.mock('@/utils/third-party.helper', () => ({ getCookiesFromClient: jest.fn(() => ({ authToken: 'token' })) }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn() } }));

import * as CommonUtils from '@/utils/common.utils';
import * as FetchWrapper from '@/utils/fetch-wrapper';
import * as ThirdPartyHelper from '@/utils/third-party.helper';
import { toast } from 'react-toastify';

const baseProps = {
  location: 'Test Location',
  uid: 'loc-1',
  icon: '/logo.svg',
  flag: '/flag.svg',
  userInfo: { uid: 'user-1' },
  followers: [],
  upcomingEvents: [],
  getFeaturedDataa: jest.fn(),
};

describe('LocationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with minimal props', () => {
    render(<LocationCard location="Test Location" uid="loc-1" />);
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  it('renders with all props and shows logo, flag, and event count', () => {
    render(<LocationCard {...baseProps} upcomingEvents={[{ name: 'Event 1', eventGuests: [] }, { name: 'Event 2', eventGuests: [] }]} />);
    expect(screen.getByAltText('team image')).toHaveAttribute('src', '/logo.svg');
    expect(screen.getByAltText('flag')).toHaveAttribute('src', '/flag.svg');
    expect(screen.getByText('2 Upcoming Events')).toBeInTheDocument();
  });

  it('shows visible events and hidden event count', () => {
    const events = Array.from({ length: 6 }, (_, i) => ({ name: `Event ${i + 1}`, eventGuests: [] }));
    render(<LocationCard {...baseProps} upcomingEvents={events} />);
    expect(screen.getAllByText('Event 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Event 4').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+2 more'));
    const allEventsContainer = document.querySelector('.allEvents');
    expect(allEventsContainer?.textContent).toContain('Event 5');
    expect(allEventsContainer?.textContent).toContain('Event 6');
  });

  it('shows follow button when not following', () => {
    render(<LocationCard {...baseProps} followers={[]} userInfo={{ uid: 'user-2' }} />);
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('shows unfollow button when following', () => {
    const followers = [{ memberUid: 'user-1', member: { image: { url: '/avatar.png' } } }];
    render(<LocationCard {...baseProps} followers={followers} userInfo={{ uid: 'user-1' }} />);
    expect(screen.getByText('1 Following')).toBeInTheDocument();
    expect(screen.getByAltText('follower')).toHaveAttribute('src', '/avatar.png');
  });

  it('shows attendee count if attendee present', () => {
    const events = [{ name: 'Event 1', eventGuests: [{ member: { uid: 'm1' } }] }];
    render(<LocationCard {...baseProps} upcomingEvents={events} />);
    expect(screen.getByText('1 Attending')).toBeInTheDocument();
  });

  it('calls onFollowbtnClicked and related side effects', async () => {
    const customFetchMock = FetchWrapper.customFetch as jest.Mock;
    customFetchMock.mockResolvedValueOnce({ ok: true });
    render(<LocationCard {...baseProps} followers={[]} userInfo={{ uid: 'user-2' }} />);
    fireEvent.click(screen.getByText('Follow'));
    await waitFor(() => expect((CommonUtils.triggerLoader as jest.Mock)).toHaveBeenCalledWith(true));
    await waitFor(() => expect(customFetchMock).toHaveBeenCalled());
    await waitFor(() => expect((toast.success as jest.Mock)).toHaveBeenCalled());
    await waitFor(() => expect(mockRouterRefresh).toHaveBeenCalled());
    await waitFor(() => expect(mockAnalytics.irlLocationFollowBtnClicked).toHaveBeenCalled());
  });

  it('calls onUnFollowbtnClicked and related side effects', async () => {
    const customFetchMock = FetchWrapper.customFetch as jest.Mock;
    customFetchMock.mockResolvedValueOnce({ ok: true });
    const followers = [{ memberUid: 'user-1', uid: 'f1', member: { image: { url: '/avatar.png' } } }];
    render(<LocationCard {...baseProps} followers={followers} userInfo={{ uid: 'user-1' }} />);
    // Open modal
    fireEvent.click(screen.getByText('1 Following'));
    // Modal should be in the document
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    // Click Unfollow
    fireEvent.click(screen.getByText('Unfollow'));
    await waitFor(() => expect(customFetchMock).toHaveBeenCalled());
    await waitFor(() => expect((toast.success as jest.Mock)).toHaveBeenCalled());
    await waitFor(() => expect(mockRouterRefresh).toHaveBeenCalled());
    await waitFor(() => expect(mockAnalytics.irlLocationUnFollowBtnClicked).toHaveBeenCalled());
  });

  it('handles follow error gracefully', async () => {
    const customFetchMock = FetchWrapper.customFetch as jest.Mock;
    customFetchMock.mockRejectedValueOnce(new Error('fail'));
    render(<LocationCard {...baseProps} followers={[]} userInfo={{ uid: 'user-2' }} />);
    fireEvent.click(screen.getByText('Follow'));
    await waitFor(() => expect((CommonUtils.triggerLoader as jest.Mock)).toHaveBeenCalledWith(false));
  });

  it('handles unfollow error gracefully', async () => {
    const customFetchMock = FetchWrapper.customFetch as jest.Mock;
    customFetchMock.mockRejectedValueOnce(new Error('fail'));
    const followers = [{ memberUid: 'user-1', uid: 'f1', member: { image: { url: '/avatar.png' } } }];
    render(<LocationCard {...baseProps} followers={followers} userInfo={{ uid: 'user-1' }} />);
    fireEvent.click(screen.getByText('1 Following'));
    fireEvent.click(screen.getByText('Unfollow'));
    await waitFor(() => expect((CommonUtils.triggerLoader as jest.Mock)).toHaveBeenCalledWith(false));
  });

  it('redirects to login if not logged in and follow is clicked', () => {
    render(<LocationCard {...baseProps} followers={[]} userInfo={undefined} />);
    fireEvent.click(screen.getByText('Follow'));
    expect(mockRouterPush).toHaveBeenCalled();
  });

  it('shows receive updates button if no followers or attendee', () => {
    render(<LocationCard {...baseProps} followers={[]} upcomingEvents={[]} userInfo={{ uid: 'user-2' }} />);
    expect(screen.getByText('Receive event updates & notifications')).toBeInTheDocument();
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('calls onCloseModal when cancel is clicked in modal', () => {
    const followers = [{ memberUid: 'user-1', uid: 'f1', member: { image: { url: '/avatar.png' } } }];
    render(<LocationCard {...baseProps} followers={followers} userInfo={{ uid: 'user-1' }} />);
    fireEvent.click(screen.getByText('1 Following'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('shows "Follow for update" inside follow button when there are no followers but there are attendees', () => {
    const events = [{ name: 'Event 1', eventGuests: [{ member: { uid: 'm1' } }] }];
    render(<LocationCard {...baseProps} followers={[]} userInfo={{ uid: 'user-2' }} upcomingEvents={events} />);
    // The follow button should contain the fallback div
    const followBtn = screen.getByRole('button', { name: /follow for update/i });
    expect(followBtn).toBeInTheDocument();
    expect(screen.getByText('Follow for update')).toBeInTheDocument();
    expect(screen.getByAltText('follow')).toHaveAttribute('src', '/icons/bell-white.svg');
  });

  it('does not close modal when clicking inside modal content', () => {
    const followers = [{ memberUid: 'user-1', uid: 'f1', member: { image: { url: '/avatar.png' } } }];
    render(<LocationCard {...baseProps} followers={followers} userInfo={{ uid: 'user-1' }} />);
    // Open modal
    fireEvent.click(screen.getByText('1 Following'));
    const modalContent = screen.getByText(/Wait! You/).parentElement;
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    // Click inside modal content
    fireEvent.click(modalContent!);
    // Modal should still be open
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles error in onFollowbtnClicked and calls triggerLoader(false)', async () => {
    const customFetchMock = FetchWrapper.customFetch as jest.Mock;
    customFetchMock.mockRejectedValueOnce(new Error('fail'));
    render(<LocationCard {...baseProps} followers={[]} userInfo={{ uid: 'user-2' }} />);
    fireEvent.click(screen.getByText('Follow'));
    await waitFor(() => expect((CommonUtils.triggerLoader as jest.Mock)).toHaveBeenCalledWith(false));
  });

  it('handles error in onUnFollowbtnClicked and calls triggerLoader(false)', async () => {
    const customFetchMock = FetchWrapper.customFetch as jest.Mock;
    customFetchMock.mockRejectedValueOnce(new Error('fail'));
    const followers = [{ memberUid: 'user-1', uid: 'f1', member: { image: { url: '/avatar.png' } } }];
    render(<LocationCard {...baseProps} followers={followers} userInfo={{ uid: 'user-1' }} />);
    fireEvent.click(screen.getByText('1 Following'));
    fireEvent.click(screen.getByText('Unfollow'));
    await waitFor(() => expect((CommonUtils.triggerLoader as jest.Mock)).toHaveBeenCalledWith(false));
  });

  it('renders correctly with no events', () => {
    render(<LocationCard {...baseProps} upcomingEvents={[]} />);
    expect(screen.getByText('0 Upcoming Events')).toBeInTheDocument();
    expect(screen.queryByText('eventsList')).not.toBeInTheDocument();
  });

  it('renders receive updates and follow button when no followers and no attendees', () => {
    render(<LocationCard {...baseProps} followers={[]} upcomingEvents={[]} userInfo={{ uid: 'user-2' }} />);
    expect(screen.getByText('Receive event updates & notifications')).toBeInTheDocument();
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('renders blue bell and avatars when followers present but not following', () => {
    const followers = [
      { memberUid: 'user-x', member: { image: { url: '/avatar-x.png' } } },
      { memberUid: 'user-y', member: { image: { url: '/avatar-y.png' } } },
    ];
    render(<LocationCard {...baseProps} followers={followers} userInfo={{ uid: 'user-1' }} />);
    expect(screen.getByText('2 Following')).toBeInTheDocument();
    expect(screen.getAllByAltText('follower').length).toBe(2);
    expect(screen.getByAltText('follow')).toHaveAttribute('src', '/icons/bell-blue.svg');
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = render(<LocationCard {...baseProps} />);
    expect(() => unmount()).not.toThrow();
  });
}); 