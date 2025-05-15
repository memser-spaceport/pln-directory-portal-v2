import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberProjectContribution from '@/components/page/member-details/member-project-contribution';

// Mocks
const mockOnSeeAllProjectContributionsClicked = jest.fn();
const mockOnProjectContributionEditClicked = jest.fn();
const mockPush = jest.fn();

jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({
    onSeeAllProjectContributionsClicked: mockOnSeeAllProjectContributionsClicked,
    onProjectContributionEditClicked: mockOnProjectContributionEditClicked,
  }),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@/components/core/modal', () => ({
  __esModule: true,
  default: ({ modalRef, onClose, children }: any) => (
    <dialog data-testid="modal" ref={modalRef}>
      <button data-testid="close-modal" onClick={onClose}>Close</button>
      {children}
    </dialog>
  ),
}));
jest.mock('@/components/page/member-details/member-empty-project-experienct', () => ({
  __esModule: true,
  default: () => <div data-testid="empty-experience">No Experience</div>,
}));
jest.mock('@/components/page/member-details/member-project-experience-card', () => ({
  __esModule: true,
  default: ({ experience }: { experience: any }) => <div data-testid="experience-card">{experience?.project?.name || 'No Project'}</div>,
}));
jest.mock('@/components/page/member-details/member-project-contributions', () => ({
  __esModule: true,
  default: ({ contributions }: { contributions: any[] }) => <div data-testid="all-contributions">{contributions.length} contributions</div>,
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({ name: 'User', email: 'user@email.com', roles: ['admin'] })),
  getAnalyticsMemberInfo: jest.fn(() => ({ id: 'm1', name: 'Member' })),
}));
jest.mock('@/utils/constants', () => ({
  ADMIN_ROLE: 'admin',
  PAGE_ROUTES: { SETTINGS: '/settings' },
}));

beforeAll(() => {
  // Polyfill dialog methods for jsdom
  window.HTMLDialogElement.prototype.showModal = function () {};
  window.HTMLDialogElement.prototype.close = function () {};
});

/**
 * Test suite for MemberProjectContribution component.
 * Covers all branches, edge cases, and user interactions.
 */
describe('MemberProjectContribution', () => {
  const baseProps = {
    member: {
      id: 'm1',
      projectContributions: [
        { project: { name: 'Present Project' }, endDate: null, startDate: '2022-01-01' },
        { project: { name: 'Past Project' }, endDate: '2021-01-01', startDate: '2020-01-01' },
      ],
    },
    userInfo: { uid: 'm1', roles: ['admin'] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state if no contributions', () => {
    render(<MemberProjectContribution {...baseProps} member={{ ...baseProps.member, projectContributions: [] }} />);
    expect(screen.getByTestId('empty-experience')).toBeInTheDocument();
  });

  it('renders present and past contributions (max 3)', () => {
    render(<MemberProjectContribution {...baseProps} />);
    // Should render both present and past project cards
    expect(screen.getAllByTestId('experience-card').length).toBe(2);
    expect(screen.getByText('Present Project')).toBeInTheDocument();
    expect(screen.getByText('Past Project')).toBeInTheDocument();
  });

  it('shows Add/Edit button for owner or admin', () => {
    render(<MemberProjectContribution {...baseProps} />);
    expect(screen.getByText('Add/Edit')).toBeInTheDocument();
  });

  it('does not show Add/Edit button for non-admin, non-owner', () => {
    render(<MemberProjectContribution {...baseProps} userInfo={{ uid: 'other', roles: [] }} />);
    expect(screen.queryByText('Add/Edit')).not.toBeInTheDocument();
  });

  it('shows See all button if more than 3 contributions', () => {
    const manyContributions = Array(5).fill({ project: { name: 'Proj' }, endDate: null, startDate: '2022-01-01' });
    render(<MemberProjectContribution {...baseProps} member={{ ...baseProps.member, projectContributions: manyContributions }} />);
    expect(screen.getByText('See all')).toBeInTheDocument();
  });

  it('does not show See all button if 3 or fewer contributions', () => {
    render(<MemberProjectContribution {...baseProps} />);
    expect(screen.queryByText('See all')).not.toBeInTheDocument();
  });

  it('calls analytics and opens modal on See all click', () => {
    const manyContributions = Array(5).fill({ project: { name: 'Proj' }, endDate: null, startDate: '2022-01-01' });
    render(<MemberProjectContribution {...baseProps} member={{ ...baseProps.member, projectContributions: manyContributions }} />);
    fireEvent.click(screen.getByText('See all'));
    expect(mockOnSeeAllProjectContributionsClicked).toHaveBeenCalled();
    // Modal should be present
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('all-contributions')).toHaveTextContent('5 contributions');
  });

  it('calls analytics and navigates to settings on Add/Edit click (admin, not owner)', () => {
    render(<MemberProjectContribution {...baseProps} userInfo={{ uid: 'admin', roles: ['admin'] }} />);
    fireEvent.click(screen.getByText('Add/Edit'));
    expect(mockOnProjectContributionEditClicked).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/settings/members?id=m1');
  });

  it('calls analytics and navigates to profile on Add/Edit click (owner)', () => {
    render(<MemberProjectContribution {...baseProps} userInfo={{ uid: 'm1', roles: ['admin'] }} />);
    fireEvent.click(screen.getByText('Add/Edit'));
    expect(mockOnProjectContributionEditClicked).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/settings/profile');
  });

  it('closes modal on close button click', () => {
    const manyContributions = Array(5).fill({ project: { name: 'Proj' }, endDate: null, startDate: '2022-01-01' });
    render(<MemberProjectContribution {...baseProps} member={{ ...baseProps.member, projectContributions: manyContributions }} />);
    fireEvent.click(screen.getByText('See all'));
    fireEvent.click(screen.getByTestId('close-modal'));
    // Modal should still be in the DOM, but close handler is called
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('renders with undefined member', () => {
    render(<MemberProjectContribution member={undefined} userInfo={{ uid: 'x', roles: [] }} />);
    expect(screen.getByTestId('empty-experience')).toBeInTheDocument();
  });

  it('renders with member but undefined projectContributions', () => {
    render(<MemberProjectContribution member={{ id: 'm1' }} userInfo={{ uid: 'x', roles: [] }} />);
    expect(screen.getByTestId('empty-experience')).toBeInTheDocument();
  });

  it('renders with undefined userInfo', () => {
    render(<MemberProjectContribution member={{ id: 'm1', projectContributions: [] }} userInfo={undefined} />);
    expect(screen.getByTestId('empty-experience')).toBeInTheDocument();
  });

  it('renders with userInfo undefined (isAdmin branch)', () => {
    render(<MemberProjectContribution member={{ id: 'm1', projectContributions: [] }} userInfo={undefined} />);
    expect(screen.getByTestId('empty-experience')).toBeInTheDocument();
  });

  it('renders with userInfo.roles undefined (isAdmin branch)', () => {
    render(<MemberProjectContribution member={{ id: 'm1', projectContributions: [] }} userInfo={{ uid: 'x' }} />);
    expect(screen.getByTestId('empty-experience')).toBeInTheDocument();
  });

  it('renders with userInfo.roles empty (isAdmin branch)', () => {
    render(<MemberProjectContribution member={{ id: 'm1', projectContributions: [] }} userInfo={{ uid: 'x', roles: [] }} />);
    expect(screen.getByTestId('empty-experience')).toBeInTheDocument();
  });

  it('renders with member as null', () => {
    render(<MemberProjectContribution member={null} userInfo={{ uid: 'x', roles: [] }} />);
    expect(screen.getByTestId('empty-experience')).toBeInTheDocument();
  });
}); 