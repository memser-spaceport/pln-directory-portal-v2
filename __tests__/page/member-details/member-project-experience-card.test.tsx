import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberProjectExperienceCard from '@/components/page/member-details/member-project-experience-card';

// Mocks
const mockOnProjectClicked = jest.fn();
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({
    onProjectClicked: mockOnProjectClicked,
  }),
}));
jest.mock('@/components/core/tooltip/tooltip', () => ({
  Tooltip: ({ trigger, content }: any) => (
    <>{trigger}{content && <span data-testid="tooltip-content">{content}</span>}</>
  ),
}));
jest.mock('@/components/page/member-details/member-experience-item', () => ({
  __esModule: true,
  default: ({ desc }: { desc: string }) => <div data-testid="desc">{desc}</div>,
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({ name: 'User', email: 'user@email.com', roles: ['admin'] })),
  getAnalyticsMemberInfo: jest.fn(() => ({ id: 'm1', name: 'Member' })),
  getAnalyticsProjectInfo: jest.fn(() => ({ id: 'p1', name: 'Project', description: 'desc' })),
}));
jest.mock('@/utils/member.utils', () => ({
  formatDate: jest.fn((date: string) => `Formatted(${date})`),
  dateDifference: jest.fn(() => '2 years'),
}));

describe('MemberProjectExperienceCard', () => {
  const baseProps = {
    experience: {
      project: {
        uid: 'p1',
        name: 'Project X',
        logo: { url: '/logo.png' },
      },
      role: 'Developer',
      startDate: '2020-01-01',
      endDate: '2022-01-01',
      currentProject: false,
      description: 'Project description',
    },
    userInfo: { name: 'User', email: 'user@email.com', roles: ['admin'] },
    member: { id: 'm1', name: 'Member' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders project name, logo, role, and description', () => {
    render(<MemberProjectExperienceCard {...baseProps} />);
    expect(screen.getByText('Project X', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByAltText('project profile')).toHaveAttribute('src', '/logo.png');
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByTestId('desc')).toHaveTextContent('Project description');
  });

  it('renders default logo if project logo is missing', () => {
    const props = {
      ...baseProps,
      experience: { ...baseProps.experience, project: { ...baseProps.experience.project, logo: undefined } },
    };
    render(<MemberProjectExperienceCard {...props} />);
    expect(screen.getByAltText('project profile')).toHaveAttribute('src', '/icons/default-project.svg');
  });

  it('renders date fields and difference', () => {
    render(<MemberProjectExperienceCard {...baseProps} />);
    const dateContainer = document.querySelector('.member-project-experience__project__desc__date');
    expect(dateContainer?.textContent).toContain('Formatted(2020-01-01)');
    expect(dateContainer?.textContent).toContain('Formatted(2022-01-01)');
    expect(dateContainer?.textContent).toContain('2 years');
  });

  it('renders current project as Present', () => {
    const props = {
      ...baseProps,
      experience: { ...baseProps.experience, currentProject: true },
    };
    render(<MemberProjectExperienceCard {...props} />);
    expect(screen.getByText('- Present')).toBeInTheDocument();
  });

  it('renders only start date and difference if endDate is missing', () => {
    const props = {
      ...baseProps,
      experience: { ...baseProps.experience, endDate: undefined },
    };
    render(<MemberProjectExperienceCard {...props} />);
    const dateContainer = document.querySelector('.member-project-experience__project__desc__date');
    expect(dateContainer?.textContent).toContain('Formatted(2020-01-01)');
    expect(dateContainer?.textContent).toContain('2 years');
  });

  it('renders deleted project with tooltip and deleted logo', () => {
    const props = {
      ...baseProps,
      experience: {
        ...baseProps.experience,
        project: { ...baseProps.experience.project, isDeleted: true },
      },
    };
    render(<MemberProjectExperienceCard {...props} />);
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('This project has been deleted');
    expect(screen.getByAltText('project profile')).toHaveAttribute('src', '/icons/deleted-project-logo.svg');
  });

  it('renders gracefully with missing project, role, and description', () => {
    const props = {
      ...baseProps,
      experience: { project: undefined, role: undefined, description: undefined },
    };
    render(<MemberProjectExperienceCard {...props} />);
    // Should not throw, and not render project name or role
    expect(screen.queryByText('Project X')).not.toBeInTheDocument();
    expect(screen.queryByText('Developer')).not.toBeInTheDocument();
  });

  it('calls analytics on project link click', () => {
    render(<MemberProjectExperienceCard {...baseProps} />);
    fireEvent.click(screen.getByRole('link'));
    expect(mockOnProjectClicked).toHaveBeenCalled();
  });
}); 