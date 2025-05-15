import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactMethod from '../../../components/page/team-details/contact-method';

// --- Mocks ---
jest.mock('next/image', () => (props: any) => <img {...props} />);
jest.mock('../../../components/page/team-details/profile-social-link', () => ({
  ProfileSocialLink: (props: any) => (
    <div data-testid="profile-social-link" onClick={() => props.callback(props.type, props.profile)}>
      {props.profile}
    </div>
  ),
}));
jest.mock('@/utils/common.utils', () => ({
  validateEmail: (email: string) => email.includes('@'),
}));

describe('ContactMethod', () => {
  const baseCallback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing if contactMethod is empty', () => {
    const { container } = render(<ContactMethod contactMethod={''} callback={baseCallback} />);
    expect(container.querySelector('.contact-method')).not.toBeInTheDocument();
  });

  it('renders contact method with email type', () => {
    render(<ContactMethod contactMethod={'user@example.com'} callback={baseCallback} />);
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByAltText('pin')).toBeInTheDocument();
    // Should pass type="email" to ProfileSocialLink
    fireEvent.click(screen.getByTestId('profile-social-link'));
    expect(baseCallback).toHaveBeenCalledWith('email', 'user@example.com');
  });

  it('renders contact method with non-email type', () => {
    render(<ContactMethod contactMethod={'https://twitter.com/user'} callback={baseCallback} />);
    expect(screen.getByText('https://twitter.com/user')).toBeInTheDocument();
    expect(screen.getByAltText('pin')).toBeInTheDocument();
    // Should pass type="" to ProfileSocialLink
    fireEvent.click(screen.getByTestId('profile-social-link'));
    expect(baseCallback).toHaveBeenCalledWith('', 'https://twitter.com/user');
  });

  it('renders correct logo and preferred props', () => {
    render(<ContactMethod contactMethod={'user@example.com'} callback={baseCallback} />);
    const img = screen.getByAltText('pin');
    expect(img).toHaveAttribute('src', '/icons/pin.svg');
    // ProfileSocialLink is rendered
    expect(screen.getByTestId('profile-social-link')).toBeInTheDocument();
  });
}); 