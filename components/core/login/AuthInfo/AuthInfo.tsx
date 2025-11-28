'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAsync } from 'react-use';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { createStateUid } from '@/services/auth.service';
import usePrivyWrapper from '@/hooks/auth/usePrivyWrapper';
import { authEvents } from '@/hooks/auth/authEvents';

import { LoadingSpinner } from './components/LoadingSpinner';

import s from './AuthInfo.module.scss';


/**
 * AuthInfo - Handles login initialization
 *
 * This component:
 * 1. Clears localStorage
 * 2. Logs out any existing session
 * 3. Creates a state UID for the login flow
 * 4. Triggers Privy login modal
 */
export function AuthInfo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analytics = useAuthAnalytics();
  const { logout } = usePrivyWrapper();

  useAsync(async () => {
    try {
      console.log('login triggered');
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
      router.push(`${window.location.pathname}${window.location.search}`);
    } catch (err) {
      console.log('Login Failed', err);
    }
  }, []);

  return (
    <div className={s.overlay}>
      <div className={s.loader}>
        <LoadingSpinner />
        Loading...
      </div>
    </div>
  );
}
