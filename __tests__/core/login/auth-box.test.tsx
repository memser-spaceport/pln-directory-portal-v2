import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthBox from '@/components/core/login/auth-box';
import useHash from '@/hooks/useHash';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { PrivyProvider } from '@privy-io/react-auth';

// Mocking necessary modules and components
jest.mock('@/hooks/useHash');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('js-cookie');
jest.mock('@privy-io/react-auth', () => ({
  PrivyProvider: jest.fn(({ children }) => <div data-testid="privy-provider">{children}</div>),
}));
jest.mock('@/components/core/login/privy-modals', () => () => <div data-testid="privy-modals" />);
jest.mock('@/components/core/login/auth-invalid-user', () => () => <div data-testid="auth-invalid-user" />);
jest.mock('@/components/core/login/auth-info', () => () => <div data-testid="auth-info" />);

describe('AuthBox Component', () => {
  const mockRouter = { push: jest.fn() };
  const originalEnv = process.env;
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    (useHash as jest.Mock).mockReturnValue('');
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    
    // Mock process.env
    process.env = { ...originalEnv, PRIVY_AUTH_ID: 'test-app-id' };
    
    // Mock window.location
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { 
      pathname: '/test-path', 
      search: '?test=value',
      hash: '' 
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    window.location = originalLocation;
  });

  test('renders PrivyProvider with correct configuration', () => {
    render(<AuthBox />);
    
    expect(PrivyProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'test-app-id',
        config: expect.objectContaining({
          appearance: expect.objectContaining({
            theme: 'light',
            accentColor: '#676FFF',
            landingHeader: 'PL Member Login',
          }),
          loginMethods: ['email', 'google', 'github', 'wallet'],
        }),
      }),
      expect.anything()
    );
  });

  test('renders PrivyModals and AuthInvalidUser components', () => {
    render(<AuthBox />);
    
    expect(screen.getByTestId('privy-provider')).toBeTruthy();
    expect(screen.getByTestId('privy-modals')).toBeTruthy();
    expect(screen.getByTestId('auth-invalid-user')).toBeTruthy();
  });

  test('renders AuthInfo component when hash is #login', () => {
    (useHash as jest.Mock).mockReturnValue('#login');
    
    render(<AuthBox />);
    
    expect(screen.getByTestId('auth-info')).toBeTruthy();
  });

  test('does not render AuthInfo component when hash is not #login', () => {
    (useHash as jest.Mock).mockReturnValue('#not-login');
    
    render(<AuthBox />);
    
    expect(screen.queryByTestId('auth-info')).toBeNull();
  });

  test('redirects user when refreshToken cookie exists', () => {
    (Cookies.get as jest.Mock).mockReturnValue('test-token');
    
    render(<AuthBox />);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/test-path?test=value');
  });

  test('does not redirect user when refreshToken cookie does not exist', () => {
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    
    render(<AuthBox />);
    
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
}); 