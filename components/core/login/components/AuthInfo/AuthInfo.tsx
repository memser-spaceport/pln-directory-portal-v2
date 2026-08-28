'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAsync } from 'react-use';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { createStateUid } from '@/services/auth.service';
import { usePrivyWrapper } from '../../hooks';
import { authEvents } from '../../utils';

import { ProgressBar } from '@/components/core/Loader/ProgressBar';

/**
 * AuthInfo - Handles login initialization
 *
 * This component:
 * 1. Clears localStorage
 * 2. Logs out any existing session
 * 3. Creates a state UID for the login flow
 * 4. Triggers Privy login modal
 *
 * It only has to cover the gap between the click and Privy's modal appearing (a logout
 * plus the createStateUid round-trip), so it shows the same top progress bar as the rest
 * of the app. It used to be a blocking rgba(0,0,0,.6) dim + "Loading..." box at z-index
 * 99999, which was both the ugliest surface in the app and the thing that painted over
 * the auth error modal when a login attempt failed. Privy renders its own backdrop for
 * its modal, so nothing here needs to supply one.
 */
export function AuthInfo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analytics = useAuthAnalytics();
  const { logout } = usePrivyWrapper();

  useAsync(async () => {
    try {
      analytics.onProceedToLogin();
      localStorage.clear();

      await logout();

      const response = await createStateUid();
      if (!response.ok) {
        throw new Error(`Error while getting stateUid: ${response.status}`);
      }

      const result = response.data;
      localStorage.setItem('stateUid', result);

      // Handle prefill email from onboarding
      const onboardingEmail = searchParams.get('prefillEmail');
      if (onboardingEmail) {
        localStorage.setItem('prefillEmail', onboardingEmail);
      }

      authEvents.emit('auth:init-login');
      // scroll: false — this fires right after login() opens the Privy modal;
      // without it, Next treats the hash-stripping push as a real navigation
      // (same canonicalUrl-vs-actual-URL mismatch as the modal's #login gate)
      // and resets the underlying page's scroll to the top.
      router.push(`${window.location.pathname}${window.location.search}`, { scroll: false });
    } catch (err) {
      console.log('Login Failed', err);
    }
  }, []);

  return <ProgressBar />;
}
