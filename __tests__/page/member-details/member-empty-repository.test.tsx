import { render, screen, fireEvent } from '@testing-library/react';
import MemberEmptyProject from '@/components/page/member-details/member-empty-repository';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { PAGE_ROUTES, ADMIN_ROLE } from '@/utils/constants';
import { getAnalyticsUserInfo, getAnalyticsMemberInfo } from '@/utils/common.utils';
import '@testing-library/jest-dom';

jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: jest.fn(),
}));

jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(),
  getAnalyticsMemberInfo: jest.fn(),
}));

describe('MemberEmptyProject Component', () => {
  const mockAnalytics = {
    onUpdateGitHubHandle: jest.fn(),
  };

  beforeEach(() => {
    (useMemberAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    userInfo: { uid: '1', roles: [] },
    member: { id: '1', githubHandle: null },
    profileType: 'user',
  };

  it('renders missing GitHub handle message for owner', () => {
    render(<MemberEmptyProject {...defaultProps} />);

    expect(screen.getByText('GitHub handle is missing. Please update your profile')).toBeInTheDocument();
    expect(screen.getByText('here')).toHaveAttribute('href', `${PAGE_ROUTES.SETTINGS}/profile`);
  });

  it('calls onUpdateGithub and analytics when "here" link is clicked for owner', () => {
    render(<MemberEmptyProject {...defaultProps} />);

    const link = screen.getByText('here');
    fireEvent.click(link);

    expect(mockAnalytics.onUpdateGitHubHandle).toHaveBeenCalled();
    expect(getAnalyticsUserInfo).toHaveBeenCalledWith(defaultProps.userInfo);
    expect(getAnalyticsMemberInfo).toHaveBeenCalledWith(defaultProps.member);
  });

  it('renders missing GitHub handle message for admin but not owner', () => {
    const newProps = {
      ...defaultProps,
      userInfo: { uid: '2', roles: [ADMIN_ROLE] },
    };

    render(<MemberEmptyProject {...newProps} />);

    expect(screen.getByText('GitHub handle is missing for the user. If you have the required information, please update')).toBeInTheDocument();
    expect(screen.getByText('here')).toHaveAttribute('href', `${PAGE_ROUTES.SETTINGS}/members?id=${newProps.member.id}`);
  });

  it('renders "No repositories to display" for owner with GitHub handle', () => {
    const newProps = {
      ...defaultProps,
      member: { id: '1', githubHandle: 'user1' },
    };

    render(<MemberEmptyProject {...newProps} />);

    expect(screen.getByText('No repositories to display')).toBeInTheDocument();
  });

  it('renders "No repositories to display" for non-owner and non-admin', () => {
    const newProps = {
      ...defaultProps,
      userInfo: { uid: '2', roles: [] }, // Not owner and not admin
    };

    render(<MemberEmptyProject {...newProps} />);

    expect(screen.getByText('No repositories to display')).toBeInTheDocument();
  });
});
