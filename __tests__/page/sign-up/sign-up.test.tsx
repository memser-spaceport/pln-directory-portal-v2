import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignUp from '@/components/page/sign-up/sign-up';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

// Mock the next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

// Mock SignUpForm and SignUpSuccess components
jest.mock('@/components/page/sign-up/sign-up-form', () => ({
  __esModule: true,
  default: ({ setSuccessFlag, skillsInfo }: any) => (
    <div data-testid="sign-up-form" onClick={() => setSuccessFlag(true)}>
      Mock SignUpForm Component
      <span data-testid="skills-info">{JSON.stringify(skillsInfo)}</span>
    </div>
  ),
}));

jest.mock('@/components/page/sign-up/sign-up-success', () => ({
  __esModule: true,
  default: () => <div data-testid="sign-up-success">Mock SignUpSuccess Component</div>,
}));

/**
 * Test suite for SignUp component.
 * Covers rendering, state management, and navigation.
 */
describe('SignUp', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();
  const mockGetParams = jest.fn();
  const mockSkillsInfo = { skills: ['React', 'TypeScript'] };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock cookies
    (Cookies.get as jest.Mock).mockImplementation(mockGet);
    
    // Mock search params
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGetParams,
    });
  });

  it('renders the sign up form initially', () => {
    render(<SignUp skillsInfo={mockSkillsInfo} />);
    
    expect(screen.getByText('PL Directory Sign up')).toBeInTheDocument();
    expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
    expect(screen.getByTestId('sign-up-form')).toBeInTheDocument();
    expect(screen.getByTestId('skills-info')).toHaveTextContent(JSON.stringify(mockSkillsInfo));
    expect(screen.queryByTestId('sign-up-success')).not.toBeInTheDocument();
  });

  it('shows the success component when form submission is successful', () => {
    render(<SignUp skillsInfo={mockSkillsInfo} />);
    
    // Simulate successful form submission
    act(() => {
      screen.getByTestId('sign-up-form').click();
    });
    
    // Success component should be shown
    expect(screen.getByTestId('sign-up-success')).toBeInTheDocument();
    expect(screen.queryByText('PL Directory Sign up')).not.toBeInTheDocument();
  });

  it('redirects to home page if user is already authenticated', () => {
    // Mock user already authenticated
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'authToken') return 'mock-token';
      return null;
    });
    
    render(<SignUp skillsInfo={mockSkillsInfo} />);
    
    // Should redirect to home page
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('saves UTM parameters to cookies if they exist in URL', () => {
    // Mock UTM parameters in URL
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (param: string) => {
        if (param === 'utm_campaign') return 'test-campaign';
        if (param === 'utm_source') return 'test-source';
        if (param === 'utm_medium') return 'test-medium';
        return null;
      },
    });
    
    render(<SignUp skillsInfo={mockSkillsInfo} />);
    
    // Should save UTM parameters to cookies
    expect(Cookies.set).toHaveBeenCalledWith('utm_campaign', 'test-campaign', { expires: 7 });
    expect(Cookies.set).toHaveBeenCalledWith('utm_source', 'test-source', { expires: 7 });
    expect(Cookies.set).toHaveBeenCalledWith('utm_medium', 'test-medium', { expires: 7 });
  });

  it('does not save UTM parameters to cookies if they are the same as existing cookies', () => {
    // Mock UTM parameters in URL
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (param: string) => {
        if (param === 'utm_campaign') return 'existing-campaign';
        if (param === 'utm_source') return 'existing-source';
        if (param === 'utm_medium') return 'existing-medium';
        return null;
      },
    });
    
    // Mock existing cookies with same values
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'utm_campaign') return 'existing-campaign';
      if (key === 'utm_source') return 'existing-source';
      if (key === 'utm_medium') return 'existing-medium';
      return null;
    });
    
    render(<SignUp skillsInfo={mockSkillsInfo} />);
    
    // Should not save UTM parameters to cookies
    expect(Cookies.set).not.toHaveBeenCalled();
  });

  it('saves only UTM parameters that are different from existing cookies', () => {
    // Mock UTM parameters in URL
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (param: string) => {
        if (param === 'utm_campaign') return 'new-campaign';
        if (param === 'utm_source') return 'existing-source';
        if (param === 'utm_medium') return 'new-medium';
        return null;
      },
    });
    
    // Mock existing cookies with some same values
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'utm_campaign') return 'existing-campaign';
      if (key === 'utm_source') return 'existing-source';
      if (key === 'utm_medium') return 'existing-medium';
      return null;
    });
    
    render(<SignUp skillsInfo={mockSkillsInfo} />);
    
    // Should only save changed UTM parameters to cookies
    expect(Cookies.set).toHaveBeenCalledWith('utm_campaign', 'new-campaign', { expires: 7 });
    expect(Cookies.set).toHaveBeenCalledWith('utm_medium', 'new-medium', { expires: 7 });
    expect(Cookies.set).not.toHaveBeenCalledWith('utm_source', expect.any(String), expect.any(Object));
  });
}); 