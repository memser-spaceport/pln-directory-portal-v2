import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignUpSuccess from '../../../components/page/sign-up/sign-up-success';

// Mock next/image
jest.mock('next/image', () => (props: any) => <img {...props} />);

// Mock useRouter
const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

// Mock analytics
const recordHomeClickAfterSuccess = jest.fn();
jest.mock('@/analytics/sign-up.analytics', () => ({
  useSignUpAnalytics: () => ({ recordHomeClickAfterSuccess }),
}));

/**
 * Test suite for SignUpSuccess component.
 */
describe('SignUpSuccess', () => {
  beforeEach(() => {
    push.mockClear();
    recordHomeClickAfterSuccess.mockClear();
  });

  it('renders all static content', () => {
    render(<SignUpSuccess />);
    expect(screen.getByAltText('under-review')).toBeInTheDocument();
    expect(screen.getByText('Profile Under Review')).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes('Thank you for signing up!') &&
        content.includes('under review') &&
        content.includes('email as soon as')
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });

  it('navigates home and records analytics on button click', () => {
    render(<SignUpSuccess />);
    const button = screen.getByText('Back to Home');
    fireEvent.click(button);
    expect(push).toHaveBeenCalledWith('/');
    expect(recordHomeClickAfterSuccess).toHaveBeenCalled();
  });
}); 