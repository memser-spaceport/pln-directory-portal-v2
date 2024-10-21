import { render, screen, fireEvent } from '@testing-library/react';
import MemberEmptyProjectExperience from '@/components/page/member-details/member-empty-project-experienct';
import { useRouter } from 'next/navigation';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { PAGE_ROUTES, ADMIN_ROLE } from '@/utils/constants';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: jest.fn(),
}));

describe('MemberEmptyProjectExperience Component', () => {
  const mockPush = jest.fn();
  const mockAnalytics = { onProjectContributionAddlicked: jest.fn() };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useMemberAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    userInfo: { uid: '1', roles: [] },
    member: { id: '1' },
    profileType: 'user',
  };

  it('renders "Click here" link for owner', () => {
    render(<MemberEmptyProjectExperience {...defaultProps} />);

    expect(screen.getByText('Click here')).toBeInTheDocument();
  });

  it('renders "No project added yet" for non-owner and non-admin', () => {
    const newProps = { ...defaultProps, userInfo: { uid: '2', roles: [] } };
    render(<MemberEmptyProjectExperience {...newProps} />);

    expect(screen.getByText('No project added yet.')).toBeInTheDocument();
  });

  it('calls analytics and navigates to member settings page for admin but not owner', () => {
    const newProps = {
      ...defaultProps,
      userInfo: { uid: '2', roles: [ADMIN_ROLE] },
    };
    render(<MemberEmptyProjectExperience {...newProps} />);

    const link = screen.getByText('Click here');
    fireEvent.click(link);

    expect(mockAnalytics.onProjectContributionAddlicked).toHaveBeenCalledWith(newProps.member);
    expect(mockPush).toHaveBeenCalledWith(`${PAGE_ROUTES.SETTINGS}/members?id=${newProps.member.id}`);
  });

  it('calls analytics and navigates to profile settings for owner', () => {
    render(<MemberEmptyProjectExperience {...defaultProps} />);

    const link = screen.getByText('Click here');
    fireEvent.click(link);

    expect(mockAnalytics.onProjectContributionAddlicked).toHaveBeenCalledWith(defaultProps.member);
    expect(mockPush).toHaveBeenCalledWith(`${PAGE_ROUTES.SETTINGS}/profile`);
  });

  it('does not render "Click here" link for non-owner and non-admin, and shows "No project added yet"', () => {
    const newProps = {
      ...defaultProps,
      userInfo: { uid: '2', roles: [] }, // Not owner and not admin
    };
  
    render(<MemberEmptyProjectExperience {...newProps} />);
  
    // Ensure the "Click here" link is not present
    expect(screen.queryByText('Click here')).not.toBeInTheDocument();
  
    // Ensure the "No project added yet" message is displayed
    expect(screen.getByText('No project added yet.')).toBeInTheDocument();
  });
});
