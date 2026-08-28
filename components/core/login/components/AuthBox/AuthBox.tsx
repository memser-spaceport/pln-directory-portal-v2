'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import useHash from '@/hooks/useHash';
import { authEvents } from '../../utils';
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

  // A login attempt that ends without a session has to take the #login gate down with it.
  // AuthInfo is a blocking z-index:99999 overlay and its own hash-stripping push on mount
  // doesn't durably land, so left alone it outlives the attempt and paints over whatever
  // replaces the Privy modal (the auth error modal) — or over nothing at all when the user
  // simply dismisses Privy. Clearing the hash also re-arms the gate: while it already reads
  // #login, a retry's push('#login') changes nothing and "Sign in" does nothing.
  useEffect(() => {
    const clearLoginHash = () => {
      // Read the live hash, not the state, so this effect never resubscribes on hash changes.
      if (window.location.hash !== '#login') return;
      // replace, not push — Back must not restore the overlay.
      // scroll: false — same canonicalUrl-vs-actual-URL mismatch as the other gate pushes.
      router.replace(`${window.location.pathname}${window.location.search}`, { scroll: false });
    };

    const unsubscribers = [
      // Every auth error code funnels through this one event.
      authEvents.on('auth:invalid-email', clearLoginHash),
      // Privy reports a dismissed login modal here (exited_auth_flow).
      authEvents.on('auth:login-error', clearLoginHash),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [router]);

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
