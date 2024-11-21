import React from 'react';
import { render, screen, fireEvent, prettyDOM } from '@testing-library/react';
import MemberProjectContribution from '@/components/page/member-details/member-project-contribution';
import { useRouter } from 'next/navigation';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { ADMIN_ROLE } from '@/utils/constants';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: jest.fn(),
}));

describe('MemberProjectContribution', () => {
  const mockRouterPush = jest.fn();
  const mockAnalytics = {
    onSeeAllProjectContributionsClicked: jest.fn(),
    onProjectContributionEditClicked: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    (useMemberAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const member = {
    id: 'member1',
    projectContributions: [
      { startDate: '2022-01-01', endDate: null },
      { startDate: '2021-01-01', endDate: '2021-12-31' },
    ],
  };

  const userInfo = {
    uid: 'user1',
    roles: [ADMIN_ROLE],
  };

  it('renders project contributions correctly', () => {
    render(<MemberProjectContribution member={member} userInfo={userInfo} />);
    expect(screen.getByText('Project Contributions (2)')).toBeInTheDocument();
  });

  it('renders Add/Edit button for admin', () => {
    render(<MemberProjectContribution member={member} userInfo={userInfo} />);
    expect(screen.getByText('Add/Edit')).toBeInTheDocument();
  });


  it('renders See all button when contributions are more than 3', () => {
    const memberWithMoreContributions = {
      ...member,
      projectContributions: [...member.projectContributions, { startDate: '2020-01-01', endDate: '2020-12-31' }, { startDate: '2019-01-01', endDate: '2019-12-31' }],
    };
    render(<MemberProjectContribution member={memberWithMoreContributions} userInfo={userInfo} />);
    expect(screen.getByText('See all')).toBeInTheDocument();
  });

  it('calls onSeeAllClickHandler when See all button is clicked', () => {
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();
    const memberWithMoreContributions = {
      ...member,
      projectContributions: [...member.projectContributions, { startDate: '2020-01-01', endDate: '2020-12-31' }, { startDate: '2019-01-01', endDate: '2019-12-31' }],
    };
    render(<MemberProjectContribution member={memberWithMoreContributions} userInfo={userInfo} />);
    fireEvent.click(screen.getByText('See all'));
    expect(mockAnalytics.onSeeAllProjectContributionsClicked).toHaveBeenCalled();
  });

  it('calls onEditOrAdd when Add/Edit button is clicked', () => {
    render(<MemberProjectContribution member={member} userInfo={userInfo} />);
    fireEvent.click(screen.getByText('Add/Edit'));
    expect(mockAnalytics.onProjectContributionEditClicked).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith('/settings/members?id=member1');
  });

  it('calls onEditOrAdd when Add/Edit button is clicked ad routes to profile page', () => {
    userInfo.uid = 'member1';
    render(<MemberProjectContribution member={member} userInfo={userInfo} />);
    fireEvent.click(screen.getByText('Add/Edit'));
    expect(mockAnalytics.onProjectContributionEditClicked).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith('/settings/profile');
  });

  it('renders empty project experience when there are no contributions', () => {
    userInfo.uid = 'user1';
    const memberWithNoContributions = {
      ...member,
      projectContributions: [],
    };
    render(<MemberProjectContribution member={memberWithNoContributions} userInfo={userInfo} />);
    expect(screen.getByText('to add project experience & contribution details.')).toBeInTheDocument();
  });

  it('calls onSeeAllClickHandler when See all button is clicked', () => {
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    const memberWithMoreContributions = {
      ...member,
      projectContributions: [...member.projectContributions, { startDate: '2020-01-01', endDate: '2020-12-31' }, { startDate: '2019-01-01', endDate: '2019-12-31' }],
    };
    const { container } = render(<MemberProjectContribution member={memberWithMoreContributions} userInfo={userInfo} />);
    fireEvent.click(screen.getByText('See all'));
    expect(mockAnalytics.onSeeAllProjectContributionsClicked).toHaveBeenCalled();
    const clsbtn = container.querySelector('img[src="/icons/close.svg"]');
    clsbtn && fireEvent.click(clsbtn);
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'close-member-projects-modal' }));
  });
});
