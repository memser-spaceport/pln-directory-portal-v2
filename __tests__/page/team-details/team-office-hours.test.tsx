import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamOfficeHours from '../../../components/page/team-details/team-office-hours';

// --- Mocks ---
const push = jest.fn();
const refresh = jest.fn();
const toastInfo = jest.fn();
const onTeamDetailOfficeHoursLoginClicked = jest.fn();
const onScheduleMeetingClicked = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }));
jest.mock('js-cookie', () => ({ get: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { info: (...args: any[]) => toastInfo(...args) } }));
jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => ({
    onTeamDetailOfficeHoursLoginClicked,
    onScheduleMeetingClicked,
  }),
}));
jest.mock('@/components/core/tooltip/tooltip', () => ({
  Tooltip: ({ trigger, content }: any) => (
    <>{trigger}{content && <span data-testid="tooltip-content">{content}</span>}</>
  ),
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsTeamInfo: (team: any) => team,
  getAnalyticsUserInfo: (user: any) => user,
}));
jest.mock('@/utils/constants', () => ({
  TEAM_OFFICE_HOURS_MSG: 'Login to Schedule with',
  TOAST_MESSAGES: { LOGGED_IN_MSG: 'Already logged in!' },
}));

describe('TeamOfficeHours', () => {
  const baseTeam = { id: 't1', name: 'Test Team', officeHours: 'https://cal.com/test' };
  const baseUserInfo = { uid: 'u1', name: 'User' };
  const baseProps = {
    team: baseTeam,
    isLoggedIn: true,
    userInfo: baseUserInfo,
    isLoggedInMemberPartOfTeam: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (require('js-cookie').get as jest.Mock).mockReturnValue(undefined);
  });

  it('renders office hours title when logged in', () => {
    render(<TeamOfficeHours {...baseProps} />);
    expect(screen.getByText('Office Hours')).toBeInTheDocument();
  });

  it('renders login prompt and login button when not logged in', () => {
    render(<TeamOfficeHours {...baseProps} isLoggedIn={false} />);
    expect(screen.getByText('Login to Schedule with Test Team')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login to Schedule/i })).toBeInTheDocument();
  });

  it('calls analytics and router.push on login button click if not logged in and no userInfo cookie', () => {
    render(<TeamOfficeHours {...baseProps} isLoggedIn={false} />);
    fireEvent.click(screen.getByText('Login to Schedule'));
    expect(onTeamDetailOfficeHoursLoginClicked).toHaveBeenCalledWith(baseTeam);
    expect(push).toHaveBeenCalledWith(`${window.location.pathname}${window.location.search}#login`);
  });

  it('shows toast and refreshes if userInfo cookie exists on login click', () => {
    (require('js-cookie').get as jest.Mock).mockReturnValue('cookie');
    render(<TeamOfficeHours {...baseProps} isLoggedIn={false} />);
    fireEvent.click(screen.getByText('Login to Schedule'));
    expect(toastInfo).toHaveBeenCalledWith('Already logged in!');
    expect(refresh).toHaveBeenCalled();
  });

  it('renders Schedule Meeting button and triggers analytics on click if not a team member', () => {
    render(<TeamOfficeHours {...baseProps} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    expect(onScheduleMeetingClicked).toHaveBeenCalledWith(baseUserInfo, baseTeam);
  });

  it('renders tooltip and disables Schedule Meeting if user is part of the team', () => {
    render(<TeamOfficeHours {...baseProps} isLoggedInMemberPartOfTeam={true} />);
    const btn = screen.getByText('Schedule Meeting');
    const link = btn.closest('a');
    expect(btn).toHaveClass('disabled');
    expect(btn).toHaveClass('cursor-default');
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('You cannot schedule meeting with your own team!');
    const preventDefaultSpy = jest.spyOn(Event.prototype, 'preventDefault');
    fireEvent.click(link as HTMLElement);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(onScheduleMeetingClicked).not.toHaveBeenCalled();
    preventDefaultSpy.mockRestore();
  });

  it('renders Not Available button if logged in but no office hours', () => {
    render(<TeamOfficeHours {...baseProps} team={{ ...baseTeam, officeHours: undefined }} />);
    const btn = screen.getByText('Not Available');
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass('disabled');
  });

  it('renders nothing if no team prop', () => {
    const { container } = render(<TeamOfficeHours isLoggedIn={false} />);
    expect(container.querySelector('.office-hours__left__msg')).toBeInTheDocument();
  });

  it('renders with minimal props (edge case: all undefined)', () => {
    const { container } = render(<TeamOfficeHours />);
    expect(container.querySelector('.office-hours')).toBeInTheDocument();
  });

  it('renders with null officeHours and not logged in', () => {
    render(<TeamOfficeHours team={{ ...baseTeam, officeHours: null }} isLoggedIn={false} />);
    expect(screen.getByText('Login to Schedule')).toBeInTheDocument();
  });

  it('renders with null officeHours and logged in', () => {
    render(<TeamOfficeHours team={{ ...baseTeam, officeHours: null }} isLoggedIn={true} />);
    expect(screen.getByText('Not Available')).toBeInTheDocument();
  });

  it('renders with undefined isLoggedInMemberPartOfTeam (defaults to false)', () => {
    render(<TeamOfficeHours {...baseProps} isLoggedInMemberPartOfTeam={undefined} />);
    fireEvent.click(screen.getByText('Schedule Meeting'));
    expect(onScheduleMeetingClicked).toHaveBeenCalledWith(baseUserInfo, baseTeam);
  });
}); 