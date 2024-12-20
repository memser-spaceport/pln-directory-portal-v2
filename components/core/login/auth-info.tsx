'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import usePrivyWrapper from '@/hooks/auth/usePrivyWrapper';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { createStateUid } from '@/services/auth.service';
import Link from 'next/link';
import { PAGE_ROUTES } from '@/utils/constants';

const AuthInfo = () => {
  // Reference to the dialog element
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { logout } = usePrivyWrapper();
  const analytics = useAuthAnalytics();

  // Initiate Privy Login and get the auth code for state
  const onLogin = async () => {
    try {
      analytics.onProceedToLogin();
      localStorage.clear();
      await logout();

      const response = await createStateUid();
      if (!response.ok) {
        throw new Error(`Error while getting stateUid: ${response.status}`);
      }

      if (response.ok) {
        const result = response.data;
        localStorage.setItem('stateUid', result);
        document.dispatchEvent(new CustomEvent('privy-init-login'));
        router.push(`${window.location.pathname}${window.location.search}`);
      }
    } catch (err) {
      console.log('Login Failed', err);
    }
  };

  // Reset Url
  const onClose = () => {
    try {
      analytics.onAuthInfoClosed();
      const queryString = window.location.search.substring(1);
      const params = new URLSearchParams(queryString);
      let queryParams = `?`;
      params?.forEach((value, key) => {
        if (!key.includes('privy_')) {
          queryParams = `${queryParams}${queryParams === '?' ? '' : '&'}${key}=${value}`;
        }
      });
      router.push(`${window.location.pathname}${queryParams === '?' ? '' : queryParams}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignUpClick = () => {
    analytics.onSignUpBtnClicked();
    onClose();
    window.location.href = PAGE_ROUTES.SIGNUP;
  };
  
  return (
    <>
      <div className="authinfo" data-testid="authinfo-container">
        <dialog open className="authinfo__dialog" ref={dialogRef}>
            <div className="authinfo__dialog__box">
              <img src="/images/login/login-banner.png" className="authinfo__dialog__box__img" alt="login banner" />
              <button onClick={onLogin} className="authinfo__dialog__actions__login">
                Proceed to Login
                <img src="/icons/arrow-right-white.svg" alt="arrow" />
              </button>
              <div className="authinfo__dialog__box__signup">
                <span>Not registered yet?</span>
                <div style={{ color: '#156FF7', fontWeight: 500, cursor: 'pointer' }} onClick={handleSignUpClick}>
                  Click here to sign up
                </div>
              </div>
              <button onClick={onClose}>
                <img width={20} height={20} src="/icons/close-rounded-black.svg" className="authinfo__dialog__box__close" alt="close" />
              </button>
            </div>
        </dialog>
      </div>

      <style global>{`
          body:has(dialog[open]) {
            overflow: auto !important;
          }
          .authinfo {
            position: fixed;
            top: 0;
            z-index: 2000;
            right: 0;
            left: 0;
            width: 100svw;
            height: 100%;
            // background: rgb(0, 0, 0, 0.6);
            display:grid;
            place-items:center;
            overflow: hidden;
            transition: backdrop-filter 100ms ease;
            backdrop-filter: blur(3px);
          }
          .authinfo__dialog {
            background: white;
            padding: 10px 5px 10px 10px;
            max-height: 90vh;
            width: 351px;
            border-radius: 24px;
            border:none;
            position:relative;
            display: flex;
            flex-direction: column;
            box-shadow: 0px 8px 36px rgba(55, 65, 81, 0.15);
          }
          .authinfo__dialog__box {
            height: auto;
            padding: 0 5px 0 0;
            overflow:auto;  
            width: 100%;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .authinfo__dialog__box__info {
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .authinfo__dialog__box__img {
            width: 100%;
            border-radius: 16px;
            height: 280px;
            background-color:#dbeafe;
            object-fit:cover;
          }
          .authinfo__dialog__box__info__text {
            font-size: 12px;
            font-weight: 400;
            text-align: center;
            line-height: 18px;
            padding: 16px 0;
          }
          .authinfo__dialog__actions__login {
            margin: 20px 0 0 0;
            padding: 10px 24px;
            border-radius: 8px;
            background: #156ff7;
            color: white;
            line-height: 20px;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content:center;
            width: 216px;
            border: 1px solid #CBD5E1;
            height: 40px;
            box-shadow: 0px 1px 1px 0px #0F172A14;
            gap: 2px;
          }
          .authinfo__dialog__box__signup {
            font-size: 14px;
            line-height: 22px;
            height: 42px;
            display: flex;
            align-items: end;
            justify-content: center;
            border-top: 1px solid #E2E8F0;
            width: 291px;
            margin: 24px 0px 20px 0px;
            gap: 4px;
          }
          .authinfo__dialog__box__close {
            position: absolute;
            top: 16px;
            right: 16px;
            display: block;
            cursor: pointer;
          }

          @media (max-width: 380px) {
           .authinfo__dialog {
              width: calc(100% - 40px);
            }
          }
          
          dialog[open] {
            animation: open 0.3s forwards;
          }

          @keyframes open {
            from {
            opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

      `}</style>
    </>
  );
};

export default AuthInfo;
