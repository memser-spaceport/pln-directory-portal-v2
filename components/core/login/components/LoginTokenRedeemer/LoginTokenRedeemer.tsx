'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { redeemLoginToken } from '@/services/auth.service';
import { useAuthTokens } from '../../hooks/useAuthTokens';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { toast } from '@/components/core/ToastContainer';
import { useAuthAnalytics } from '@/analytics/auth.analytics';

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
  const analytics = useAuthAnalytics();
  const attemptedRef = useRef(false);
  const loginToken = searchParams.get('loginToken');
  const shouldAutoLogin = Boolean(loginToken && !isLoggedIn);
  const [isRedeeming, setIsRedeeming] = useState(shouldAutoLogin);

  useEffect(() => {
    setIsRedeeming(shouldAutoLogin);
  }, [shouldAutoLogin]);

  useEffect(() => {
    if (isLoggedIn || !loginToken || attemptedRef.current) {
      return;
    }
    attemptedRef.current = true;

    let cancelled = false;

    (async () => {
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
        analytics.onDirectoryLoginSuccess({ isAutoLogin: true });
        setIsRedeeming(false);
        // Let the signing-in modal unmount before showing success toast
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (cancelled) {
          return;
        }
        toast.success(TOAST_MESSAGES.LOGIN_MSG);
        Cookies.set('showNotificationPopup', JSON.stringify(true));
        document.dispatchEvent(
          new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: { status: true, isShowPopup: false } }),
        );

        const cleanUrl = `${window.location.pathname}${stripLoginParams(window.location.search)}`;
        window.location.replace(cleanUrl);
        return;
      }

      setIsRedeeming(false);
      const cleanUrl = `${window.location.pathname}${stripLoginParams(window.location.search)}#login`;
      router.replace(cleanUrl, { scroll: false });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per loginToken; analytics is stable enough for capture
  }, [isLoggedIn, loginToken, router, saveSessionTokens]);

  if (!isRedeeming) {
    return null;
  }

  return (
    <div className="loginTokenLoader" role="status" aria-live="polite" aria-busy="true">
      <div className="loginTokenLoader__card">
        <svg
          aria-hidden="true"
          className="loginTokenLoader__spinner"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span>Signing you in…</span>
      </div>

      <style jsx>{`
        .loginTokenLoader {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .loginTokenLoader__card {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 20px 24px;
          border-radius: 10px;
          color: #000;
          font-size: 14px;
          font-weight: 500;
        }

        .loginTokenLoader__spinner {
          height: 20px;
          width: 20px;
          fill: #1b4dff;
          color: #d4d4d4;
          animation: loginTokenSpin 1s linear infinite;
        }

        @keyframes loginTokenSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
