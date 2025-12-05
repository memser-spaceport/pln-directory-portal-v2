jest.mock('@privy-io/react-auth', () => ({
  PrivyProvider: ({ children }: any) => children,
  usePrivy: () => ({
    ready: false,
    authenticated: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
  useWallets: () => ({ wallets: [], ready: false }),
  useLoginWithEmail: () => ({
    loginWithEmail: jest.fn(),
    state: { status: 'initial' },
  }),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { AuthInfo } from '@/components/core/login';
import { useRouter } from 'next/navigation';
import { usePrivyWrapper } from '@/components/core/login/hooks';
import { createStateUid } from '@/services/auth.service';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({}),
    text: async () => '',
    status: 200,
  } as Response),
) as jest.Mock;

// Mocking necessary hooks and functions
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/components/core/login/hooks/usePrivyWrapper', () => ({
  default: jest.fn(() => ({
    logout: jest.fn(),
  })),
}));

jest.mock('@/services/auth.service', () => ({
  createStateUid: jest.fn(),
}));

describe.skip('AuthInfo Component', () => {
  const mockRouter = { push: jest.fn() };
  const mockLogout = jest.fn();
  const mockCreateStateUid = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePrivyWrapper as jest.Mock).mockReturnValue({ logout: mockLogout });
    (createStateUid as jest.Mock).mockImplementation(mockCreateStateUid);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders AuthInfo component', () => {
    render(<AuthInfo />);
    expect(screen.getByTestId('authinfo-container')).not.toBeNull();
    expect(screen.getByText(/Proceed to Login/i)).not.toBeNull();
  });

  test('does not include privy_ keys in query params', () => {
    render(<AuthInfo />);

    // Simulate a URL with privy_ keys
    window.history.pushState({}, 'Test Title', '/?privy_test=value&other=value');

    fireEvent.click(screen.getByTestId('close-button'));

    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('other=value'));
  });
});
