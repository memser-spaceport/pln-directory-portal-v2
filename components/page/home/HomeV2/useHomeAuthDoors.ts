'use client';

import { useRouter } from 'next/navigation';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { useHomeAnalytics, type HomeAuthDoorSection } from '@/analytics/home.analytics';
import { useLoginRedirect } from '@/components/core/login/utils';
import { toast } from '@/components/core/ToastContainer';
import { useCurrentUserStore } from '@/services/auth/store';
import { TOAST_MESSAGES } from '@/utils/constants';

/**
 * The new Home's two doors, as the navbar opens them: Sign up goes to the navbar Sign up's target (`/sign-up` with
 * `returnTo`), Sign in runs the navbar Sign in's path (`#login`, which loads Privy). Each also records
 * `home-auth-door-clicked` with the section it was pressed in.
 */
export function useHomeAuthDoors() {
  const router = useRouter();
  const authAnalytics = useAuthAnalytics();
  const homeAnalytics = useHomeAnalytics();
  const goToLogin = useLoginRedirect();

  const signUp = (section: HomeAuthDoorSection) => {
    homeAnalytics.onAuthDoorClicked({ door: 'sign_up', section });
    authAnalytics.onSignUpBtnClicked();
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    // push, not replace (the navbar uses replace): Back from sign-up should return to this page.
    router.push(`/sign-up?returnTo=${returnTo}`);
  };

  const signIn = (section: HomeAuthDoorSection) => {
    homeAnalytics.onAuthDoorClicked({ door: 'sign_in', section });
    authAnalytics.onLoginBtnClicked();
    if (useCurrentUserStore.getState().currentUser) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      goToLogin();
    }
  };

  return { signUp, signIn };
}
