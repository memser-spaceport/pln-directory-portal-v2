import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';

// Mocks
jest.mock('@/utils/common.utils', () => ({
  getSocialLinkUrl: jest.fn((profile, type, handle) => `url-for-${type}-${profile}-${handle}`),
}));
jest.mock('@/components/core/tooltip/tooltip', () => ({
  Tooltip: ({ trigger, content }: any) => (
    <>{trigger}{content && <span data-testid="tooltip-content">{content}</span>}</>
  ),
}));

describe('ProfileSocialLink', () => {
  const baseProps = {
    type: 'twitter',
    logo: '/logo.svg',
    height: 24,
    width: 24,
    preferred: true,
    profile: 'user123',
    handle: '@user123',
    callback: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with all props and preferred style', () => {
    render(<ProfileSocialLink {...baseProps} />);
    const link = screen.getByTestId('profile-social-link');
    expect(link).toHaveAttribute('href', 'url-for-twitter-user123-@user123');
    expect(link).toHaveClass('preffered');
    expect(screen.getByAltText('twitter')).toHaveAttribute('src', '/logo.svg');
    expect(screen.getByText('user123', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('user123');
  });

  it('renders with not-preferred style', () => {
    render(<ProfileSocialLink {...baseProps} preferred={false} />);
    const link = screen.getByTestId('profile-social-link');
    expect(link).toHaveClass('not-preferred');
  });

  it('renders with missing logo', () => {
    render(<ProfileSocialLink {...baseProps} logo={undefined} />);
    expect(screen.getByAltText('twitter')).toBeInTheDocument();
  });

  it('renders with missing profile (falls back to handle)', () => {
    render(<ProfileSocialLink {...baseProps} profile={''} />);
    expect(screen.getByText('@user123')).toBeInTheDocument();
  });

  it('calls callback with type and url on click', () => {
    const callback = jest.fn();
    render(<ProfileSocialLink {...baseProps} callback={callback} />);
    fireEvent.click(screen.getByTestId('profile-social-link'));
    expect(callback).toHaveBeenCalledWith('twitter', 'url-for-twitter-user123-@user123');
  });

  it('renders with missing height and width', () => {
    render(<ProfileSocialLink {...baseProps} height={undefined} width={undefined} />);
    expect(screen.getByAltText('twitter')).toBeInTheDocument();
  });

  it('renders with empty handle and profile', () => {
    render(<ProfileSocialLink {...baseProps} profile={''} handle={''} />);
    expect(screen.getByText('', { selector: 'p' })).toBeInTheDocument();
  });

  it('renders with preferred undefined (defaults to not-preferred)', () => {
    render(<ProfileSocialLink {...baseProps} preferred={undefined} />);
    const link = screen.getByTestId('profile-social-link');
    expect(link).toHaveClass('not-preferred');
  });
}); 