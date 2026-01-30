'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import useHash from '@/hooks/useHash';
import { PrivyModals } from '../PrivyModals';
import { AuthInvalidUser } from '../modals/AuthInvalidUser';
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
 * AuthBox - Main authentication wrapper component
 *
 * Provides Privy authentication context and renders auth-related modals.
 * Shows login modal when URL hash is #login and user is not authenticated.
 */
export function AuthBox({ isLoggedIn }: { isLoggedIn: boolean }) {
  const hash = useHash();
  const router = useRouter();
  const isLoginPopup = hash === '#login' && !isLoggedIn;

  // Prevent authenticated users from accessing login modal
  useEffect(() => {
    if (isLoggedIn && hash === '#login') {
      // Only redirect if the hash is specifically #login, preserve other hashes
      router.push(`${window.location.pathname}${window.location.search}`);
    }
  }, [router, hash, isLoggedIn]);

  return (
    <PrivyProvider appId={process.env.PRIVY_AUTH_ID as string} config={PRIVY_CONFIG}>
      <PrivyModals />
      <AuthInvalidUser />
      {isLoginPopup && <AuthInfo />}
    </PrivyProvider>
  );
}
