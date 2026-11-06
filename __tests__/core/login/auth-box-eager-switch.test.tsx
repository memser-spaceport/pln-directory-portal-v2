/**
 * LAB-3092 rollback: with NEXT_PUBLIC_EAGER_PRIVY=true at build time, Privy loads for every visitor, as before.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/home',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
jest.mock('@privy-io/react-auth', () => ({
  PrivyProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="privy-provider">{children}</div>,
}));
jest.mock('next/dynamic', () => () => {
  const DynamicPrivyLayer = (props: { isLoginPopup: boolean }) => {
    const { PrivyLayer } = jest.requireActual('@/components/core/login/components/PrivyLayer');
    return <PrivyLayer {...props} />;
  };
  return DynamicPrivyLayer;
});
jest.mock('@/components/core/login/components/PrivyModals', () => ({ PrivyModals: () => null }));
jest.mock('@/components/core/login/components/AuthInfo', () => ({ AuthInfo: () => null }));
jest.mock('@/components/core/login/components/modals/AuthInvalidUser', () => ({ AuthInvalidUser: () => null }));
jest.mock('@/components/core/login/components/LoginTokenRedeemer', () => ({ LoginTokenRedeemer: () => null }));

import { AuthBox } from '@/components/core/login/components/AuthBox';

const renderSignedOut = () => {
  window.history.replaceState({}, '', '/home');
  render(<AuthBox isLoggedIn={false} />);
};

describe('NEXT_PUBLIC_EAGER_PRIVY', () => {
  const original = process.env.NEXT_PUBLIC_EAGER_PRIVY;
  afterEach(() => {
    process.env.NEXT_PUBLIC_EAGER_PRIVY = original;
  });

  it('loads Privy for a signed-out visitor when set to true', () => {
    process.env.NEXT_PUBLIC_EAGER_PRIVY = 'true';
    renderSignedOut();
    expect(screen.getByTestId('privy-provider')).toBeInTheDocument();
  });

  it('leaves it out by default', () => {
    delete process.env.NEXT_PUBLIC_EAGER_PRIVY;
    renderSignedOut();
    expect(screen.queryByTestId('privy-provider')).not.toBeInTheDocument();
  });
});
