'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import useHash from '@/hooks/useHash';
import { PrivyModals } from '../PrivyModals';
import { AuthInvalidUser } from '../modals/AuthInvalidUser';
import { AuthInfo } from '../AuthInfo';
import { LoginTokenRedeemer } from '../LoginTokenRedeemer';

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
      // Only redirect if the hash is specifically #login, preserve other hashes.
      // scroll: false — same canonicalUrl-vs-actual-URL mismatch as AuthInfo's
      // push can make this look like a real navigation and reset scroll.
      router.push(`${window.location.pathname}${window.location.search}`, { scroll: false });
    }
  }, [router, hash, isLoggedIn]);

  return (
    <PrivyProvider appId={process.env.PRIVY_AUTH_ID as string} config={PRIVY_CONFIG}>
      <Suspense fallback={null}>
        <LoginTokenRedeemer isLoggedIn={isLoggedIn} />
      </Suspense>
      <PrivyModals />
      <AuthInvalidUser />
      {isLoginPopup && <AuthInfo />}
    </PrivyProvider>
  );
}
