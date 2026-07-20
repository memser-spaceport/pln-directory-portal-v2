'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { redeemLoginToken } from '@/services/auth.service';
import { useAuthTokens } from '../../hooks/useAuthTokens';
import { triggerLoader } from '@/utils/common.utils';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { toast } from '@/components/core/ToastContainer';

function stripLoginParams(search: string): string {
  const params = new URLSearchParams(search);
  params.delete('loginToken');
  params.delete('prefillEmail');
  const next = params.toString();
  return next ? `?${next}` : '';
}

/**
 * Auto-redeems `loginToken` query param when the user is logged out.
 * On success: sets session cookies and reloads with clean URL.
 * On failure: clears the token and opens Privy `#login`.
 */
export function LoginTokenRedeemer({ isLoggedIn }: { isLoggedIn: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { saveSessionTokens } = useAuthTokens();
  const attemptedRef = useRef(false);
  const loginToken = searchParams.get('loginToken');

  useEffect(() => {
    if (isLoggedIn || !loginToken || attemptedRef.current) {
      return;
    }
    attemptedRef.current = true;

    let cancelled = false;

    (async () => {
      triggerLoader(true);
      const response = await redeemLoginToken(loginToken);
      if (cancelled) {
        return;
      }

      if (response.ok && response.data?.accessToken && response.data?.userInfo) {
        const formatted = structuredClone(response.data);
        if (formatted.userInfo && 'isFirstTimeLogin' in formatted.userInfo) {
          delete (formatted.userInfo as { isFirstTimeLogin?: boolean }).isFirstTimeLogin;
        }
        saveSessionTokens(formatted);
        toast.success(TOAST_MESSAGES.LOGIN_MSG);
        Cookies.set('showNotificationPopup', JSON.stringify(true));
        document.dispatchEvent(
          new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: { status: true, isShowPopup: false } })
        );

        const cleanUrl = `${window.location.pathname}${stripLoginParams(window.location.search)}`;
        window.location.replace(cleanUrl);
        return;
      }

      triggerLoader(false);
      const cleanUrl = `${window.location.pathname}${stripLoginParams(window.location.search)}#login`;
      router.replace(cleanUrl, { scroll: false });
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, loginToken, router, saveSessionTokens]);

  return null;
}
