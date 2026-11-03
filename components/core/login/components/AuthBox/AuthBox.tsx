'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

import useHash from '@/hooks/useHash';
import { authEvents, privyDemand } from '../../utils';
import { AuthInvalidUser } from '../modals/AuthInvalidUser';
import { LoginTokenRedeemer } from '../LoginTokenRedeemer';

/**
 * The sign-in system (Privy) and everything that needs it, in its own chunk (LAB-3092). Its SDK is the largest script
 * on every page; a signed-out visitor only needs it once they start to sign in.
 */
const PrivyLayer = dynamic(() => import('../PrivyLayer').then((m) => m.PrivyLayer), { ssr: false });

/**
 * Build-time rollback: `NEXT_PUBLIC_EAGER_PRIVY=true` loads Privy for every visitor, as before LAB-3092. Next inlines
 * the value at build time wherever it is read.
 */
const isEagerPrivy = () => process.env.NEXT_PUBLIC_EAGER_PRIVY === 'true';

const getServerDemand = () => false;

/**
 * AuthBox - the always-present part of authentication.
 *
 * It needs no Privy: the `#login` hash gates, the one-time login link and the auth error modals. The Privy layer is
 * loaded when the viewer is signed in (as before), when a sign-in starts (`#login`), or when a sign-in, account link or
 * sign-out reaches the auth event bus with nothing loaded to carry it out. Once loaded it stays, so a dismissed or
 * failed sign-in never unloads it mid-flow.
 */
export function AuthBox({ isLoggedIn }: { isLoggedIn: boolean }) {
  const hash = useHash();
  const router = useRouter();
  const isLoginPopup = hash === '#login' && !isLoggedIn;
  const demanded = useSyncExternalStore(privyDemand.subscribe, privyDemand.isRequested, getServerDemand);
  const loadPrivy = isEagerPrivy() || isLoggedIn || isLoginPopup || demanded;

  // A sign-in that has started keeps Privy loaded after the hash is cleared.
  useEffect(() => {
    if (isLoginPopup) privyDemand.request();
  }, [isLoginPopup]);

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
    <>
      <Suspense fallback={null}>
        <LoginTokenRedeemer isLoggedIn={isLoggedIn} />
      </Suspense>
      <AuthInvalidUser />
      {loadPrivy && <PrivyLayer isLoginPopup={isLoginPopup} />}
    </>
  );
}
