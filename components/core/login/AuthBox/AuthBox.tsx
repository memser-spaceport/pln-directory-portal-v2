'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import useHash from '@/hooks/useHash';
import { PrivyModals } from '../PrivyModals';
import { AuthInvalidUser } from '../AuthInvalidUser';
import { AuthInfo } from '../AuthInfo';

const PRIVY_CONFIG = {
  appearance: {
    theme: 'light' as const,
    accentColor: '#676FFF',
    landingHeader: 'PL Member Login',
  },
  loginMethods: ['email', 'google', 'github', 'wallet'] as const,
};

/**
 * AuthBox - Main authentication wrapper component
 *
 * Provides Privy authentication context and renders auth-related modals.
 * Shows login modal when URL hash is #login.
 */
export function AuthBox() {
  const hash = useHash();
  const router = useRouter();
  const isLoginPopup = hash === '#login';

  // Prevent authenticated users from accessing login modal
  useEffect(() => {
    if (Cookies.get('refreshToken')) {
      router.push(`${window.location.pathname}${window.location.search}`);
    }
  }, [router]);

  return (
    <PrivyProvider appId={process.env.PRIVY_AUTH_ID as string} config={PRIVY_CONFIG}>
      <PrivyModals />
      <AuthInvalidUser />
      {isLoginPopup && <AuthInfo />}
    </PrivyProvider>
  );
}
