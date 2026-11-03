'use client';

import { PrivyProvider } from '@privy-io/react-auth';

import { PrivyModals } from '../PrivyModals';
import { AuthInfo } from '../AuthInfo';

const PRIVY_CONFIG = {
  appearance: {
    theme: 'light' as const,
    accentColor: '#676FFF' as `#${string}`,
    landingHeader: 'PL Member Login',
  },
  loginMethods: ['email', 'google', 'github', 'wallet'] as ('email' | 'google' | 'github' | 'wallet')[],
};

/**
 * Everything that needs the sign-in system (Privy), in one lazily loaded module (LAB-3092): the provider, the handlers
 * for sign-in, linking and sign-out, and the `#login` overlay that starts a sign-in. `AuthBox` loads it only when the
 * page needs it, so a signed-out visitor who never signs in downloads none of it.
 */
export function PrivyLayer({ isLoginPopup }: { isLoginPopup: boolean }) {
  return (
    <PrivyProvider appId={process.env.PRIVY_AUTH_ID as string} config={PRIVY_CONFIG}>
      <PrivyModals />
      {isLoginPopup && <AuthInfo />}
    </PrivyProvider>
  );
}
