import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberProfileLoginStrip from '@/components/page/member-details/member-details-login-strip';
import { TOAST_MESSAGES } from '@/utils/constants';

// Mocks
const mockRefresh = jest.fn();
const mockPush = jest.fn();
const mockOnLoginBtnClicked = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
    push: mockPush,
  }),
}));
jest.mock('js-cookie', () => ({
  get: jest.fn(),
}));
jest.mock('react-toastify', () => ({
  toast: { info: jest.fn() },
}));
jest.mock('@/analytics/auth.analytics', () => ({
  useAuthAnalytics: () => ({
    onLoginBtnClicked: mockOnLoginBtnClicked,
  }),
}));

describe('MemberProfileLoginStrip', () => {
  /**
   * Minimal valid IMember mock for testing.
   */
  const member = {
    id: '1',
    name: 'Alice',
    skills: [{ title: 'React' }] as [{ title: string }],
    projectContributions: [] as [],
    location: {
      metroArea: '',
      city: '',
      country: '',
      region: '',
      continent: '',
    },
    officeHours: null,
    teamLead: false,
    teams: [],
    mainTeam: null,
    openToWork: false,
    preferences: {
      showEmail: false,
      showDiscord: false,
      showTwitter: false,
      showLinkedin: false,
      showTelegram: false,
      showGithubHandle: false,
      showGithubProjects: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Use Object.defineProperty to mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/profile',
        search: '?q=1',
      },
      writable: true,
    });
  });

  /**
   * Renders the component and returns the login button node.
   */
  function renderComponent() {
    render(<MemberProfileLoginStrip member={member} />);
    // The login button is a span with class login-strip__content__login
    return screen.getByText('Login');
  }

  it('renders the login strip with member name and description', () => {
    render(<MemberProfileLoginStrip member={member} />);
    // Find the <p> element and check its textContent
    const desc = document.querySelector('.login-strip__content__desc');
    expect(desc?.textContent).toContain("You are viewing Alice's limited profile.");
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText(/to access details such as social profiles/)).toBeInTheDocument();
    expect(screen.getByAltText('lock')).toHaveAttribute('src', '/icons/lock-blue.svg');
  });

  it('shows toast and refreshes if user is already logged in', () => {
    const Cookies = require('js-cookie');
    Cookies.get.mockReturnValue('someUserInfo');
    const { toast } = require('react-toastify');
    renderComponent();
    fireEvent.click(screen.getByText('Login'));
    expect(toast.info).toHaveBeenCalledWith(TOAST_MESSAGES.LOGGED_IN_MSG);
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockOnLoginBtnClicked).not.toHaveBeenCalled();
  });

  it('triggers analytics and navigates to login if not logged in', () => {
    const Cookies = require('js-cookie');
    Cookies.get.mockReturnValue(undefined);
    renderComponent();
    fireEvent.click(screen.getByText('Login'));
    expect(mockOnLoginBtnClicked).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/profile?q=1#login');
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('handles missing member name gracefully', () => {
    render(<MemberProfileLoginStrip member={{ ...member, name: '' }} />);
    const desc = document.querySelector('.login-strip__content__desc');
    expect(desc?.textContent).toContain("You are viewing 's limited profile.");
  });

  it('does not break if member is undefined', () => {
    // @ts-expect-error
    render(<MemberProfileLoginStrip member={undefined} />);
    const desc = document.querySelector('.login-strip__content__desc');
    expect(desc?.textContent).toContain("You are viewing  limited profile.");
  });
}); 