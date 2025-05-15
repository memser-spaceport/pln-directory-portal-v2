import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactInfo from '../../../components/page/team-details/contact-info';

// --- Mocks ---
jest.mock('../../../components/page/team-details/contact-method', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="contact-method-mock" onClick={() => props.callback('mockType', 'mockUrl')}>
      ContactMethod: {props.contactMethod}
    </div>
  ),
}));
jest.mock('../../../components/page/team-details/profile-social-link', () => ({
  ProfileSocialLink: (props: any) => (
    <div data-testid={`profile-social-link-mock-${props.type}`} onClick={() => props.callback(props.type, props.profile)}>
      {props.profile}
    </div>
  ),
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsTeamInfo: jest.fn(() => ({ id: 'team-1' })),
  getAnalyticsUserInfo: jest.fn(() => ({ id: 'user-1' })),
  getProfileFromURL: jest.fn((url: string, type: string) => `profile-for-${type}`),
}));
const onTeamDetailContactClicked = jest.fn();
jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => ({
    onTeamDetailContactClicked,
  }),
}));

describe('ContactInfo', () => {
  const baseTeam = {
    website: 'https://team.com',
    twitter: 'https://twitter.com/team',
    contactMethod: 'team@contact.com',
    linkedinHandle: 'team-linkedin',
  };
  const baseUserInfo = { id: 'user-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all contact methods when all fields are present', () => {
    render(<ContactInfo team={baseTeam as any} userInfo={baseUserInfo as any} />);
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
    expect(screen.getByTestId('contact-method-mock')).toHaveTextContent('ContactMethod: team@contact.com');
    expect(screen.getByTestId('profile-social-link-mock-website')).toHaveTextContent('profile-for-website');
    expect(screen.getByTestId('profile-social-link-mock-twitter')).toHaveTextContent('profile-for-twitter');
    expect(screen.getByTestId('profile-social-link-mock-linkedin')).toHaveTextContent('profile-for-linkedin');
  });

  it('does not render contact method if contactMethod is missing', () => {
    render(<ContactInfo team={{ ...baseTeam, contactMethod: undefined } as any} userInfo={baseUserInfo as any} />);
    expect(screen.queryByTestId('contact-method-mock')).not.toBeInTheDocument();
  });

  it('does not render website if website is missing', () => {
    render(<ContactInfo team={{ ...baseTeam, website: undefined } as any} userInfo={baseUserInfo as any} />);
    expect(screen.queryByTestId('profile-social-link-mock-website')).not.toBeInTheDocument();
  });

  it('does not render twitter if twitter is missing', () => {
    render(<ContactInfo team={{ ...baseTeam, twitter: undefined } as any} userInfo={baseUserInfo as any} />);
    expect(screen.queryByTestId('profile-social-link-mock-twitter')).not.toBeInTheDocument();
  });

  it('does not render linkedin if linkedinHandle is missing', () => {
    render(<ContactInfo team={{ ...baseTeam, linkedinHandle: undefined } as any} userInfo={baseUserInfo as any} />);
    expect(screen.queryByTestId('profile-social-link-mock-linkedin')).not.toBeInTheDocument();
  });

  it('renders nothing but the title if all contact fields are missing', () => {
    render(<ContactInfo team={{} as any} userInfo={baseUserInfo as any} />);
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
    expect(screen.queryByTestId('contact-method-mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-social-link-mock-website')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-social-link-mock-twitter')).not.toBeInTheDocument();
    expect(screen.queryByTestId('profile-social-link-mock-linkedin')).not.toBeInTheDocument();
  });

  it('calls analytics callback when a contact method is clicked', () => {
    render(<ContactInfo team={baseTeam as any} userInfo={baseUserInfo as any} />);
    fireEvent.click(screen.getByTestId('contact-method-mock'));
    expect(onTeamDetailContactClicked).toHaveBeenCalledWith({ id: 'team-1' }, { id: 'user-1' }, 'mockType', 'mockUrl');
  });

  it('calls analytics callback when a website link is clicked', () => {
    render(<ContactInfo team={baseTeam as any} userInfo={baseUserInfo as any} />);
    fireEvent.click(screen.getByTestId('profile-social-link-mock-website'));
    expect(onTeamDetailContactClicked).toHaveBeenCalledWith({ id: 'team-1' }, { id: 'user-1' }, 'website', 'profile-for-website');
  });

  it('calls analytics callback when a twitter link is clicked', () => {
    render(<ContactInfo team={baseTeam as any} userInfo={baseUserInfo as any} />);
    fireEvent.click(screen.getByTestId('profile-social-link-mock-twitter'));
    expect(onTeamDetailContactClicked).toHaveBeenCalledWith({ id: 'team-1' }, { id: 'user-1' }, 'twitter', 'profile-for-twitter');
  });

  it('calls analytics callback when a linkedin link is clicked', () => {
    render(<ContactInfo team={baseTeam as any} userInfo={baseUserInfo as any} />);
    fireEvent.click(screen.getByTestId('profile-social-link-mock-linkedin'));
    expect(onTeamDetailContactClicked).toHaveBeenCalledWith({ id: 'team-1' }, { id: 'user-1' }, 'linkedin', 'profile-for-linkedin');
  });

  it('handles undefined team and userInfo gracefully', () => {
    render(<ContactInfo team={undefined} userInfo={undefined} />);
    expect(screen.getByText('Contact Details')).toBeInTheDocument();
  });
}); 