import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactDetails from '@/components/page/member-details/contact-details';

// Mock ProfileSocialLink to just render a button for each type
jest.mock('@/components/page/member-details/profile-social-link', () => ({
  ProfileSocialLink: ({ type, handle, callback }: any) => (
    <button data-testid={`social-${type}`} onClick={() => callback(type, handle)}>{type}:{handle}</button>
  ),
}));

const onSocialProfileLinkClicked = jest.fn();
jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => ({ onSocialProfileLinkClicked }),
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({ name: 'User', email: 'user@email.com', roles: ['admin'] })),
  getAnalyticsMemberInfo: jest.fn(() => ({ id: 'm1', name: 'Test Member' })),
  getProfileFromURL: jest.fn((handle, type) => `${type}-profile`),
}));

describe('ContactDetails', () => {
  const baseProps: any = {
    member: {
      id: 'm1',
      name: 'Test Member',
      githubHandle: 'gh',
      discordHandle: 'discord',
      telegramHandle: 'telegram',
      twitter: 'twitter',
      linkedinHandle: 'linkedin',
      email: 'test@email.com',
      skills: [{ title: 'JS' }],
      projectContributions: [],
      location: { metroArea: '', city: '', country: '', region: '', continent: '' },
      officeHours: null,
      teamLead: false,
      teams: [],
      mainTeam: null,
      openToWork: false,
      preferences: {
        showEmail: true,
        showDiscord: true,
        showTwitter: true,
        showLinkedin: true,
        showTelegram: true,
        showGithubHandle: true,
        showGithubProjects: true,
      },
    },
    isLoggedIn: true,
    userInfo: { name: 'User', email: 'user@email.com', uid: 'u1', roles: ['admin'] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all social links if present', () => {
    render(<ContactDetails {...baseProps} />);
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
    expect(screen.getByTestId('social-linkedin')).toBeInTheDocument();
    expect(screen.getByTestId('social-twitter')).toBeInTheDocument();
    expect(screen.getByTestId('social-discord')).toBeInTheDocument();
    expect(screen.getByTestId('social-telegram')).toBeInTheDocument();
    expect(screen.getByTestId('social-email')).toBeInTheDocument();
    expect(screen.getByTestId('social-github')).toBeInTheDocument();
  });

  it('does not render links if handles are missing', () => {
    const member = { ...baseProps.member, githubHandle: undefined, discordHandle: undefined, telegramHandle: undefined, twitter: undefined, linkedinHandle: undefined, email: undefined };
    render(<ContactDetails {...baseProps} member={member} />);
    expect(screen.queryByTestId('social-linkedin')).not.toBeInTheDocument();
    expect(screen.queryByTestId('social-twitter')).not.toBeInTheDocument();
    expect(screen.queryByTestId('social-discord')).not.toBeInTheDocument();
    expect(screen.queryByTestId('social-telegram')).not.toBeInTheDocument();
    expect(screen.queryByTestId('social-email')).not.toBeInTheDocument();
    expect(screen.queryByTestId('social-github')).not.toBeInTheDocument();
  });

  it('fires analytics callback when a social link is clicked', () => {
    render(<ContactDetails {...baseProps} />);
    fireEvent.click(screen.getByTestId('social-linkedin'));
    expect(onSocialProfileLinkClicked).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'linkedin',
      'linkedin'
    );
  });

  it('renders with only one social link present', () => {
    const member = { ...baseProps.member, githubHandle: undefined, discordHandle: undefined, telegramHandle: undefined, twitter: undefined, linkedinHandle: undefined, email: 'test@email.com' };
    render(<ContactDetails {...baseProps} member={member} />);
    expect(screen.getByTestId('social-email')).toBeInTheDocument();
    expect(screen.queryByTestId('social-linkedin')).not.toBeInTheDocument();
  });
}); 