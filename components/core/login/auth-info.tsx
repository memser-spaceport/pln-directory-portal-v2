'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import usePrivyWrapper from '@/hooks/auth/usePrivyWrapper';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { createStateUid } from '@/services/auth.service';
import { LOGIN_BANNER_URL } from '@/utils/constants';

const AuthInfo = () => {
  // Reference to the dialog element
  const dialogRef = useRef<HTMLDialogElement>(null);
  const loginBanner = LOGIN_BANNER_URL;
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

  return (
    <>
      <div className="authinfo" data-testid="authinfo-container">
        <dialog open className="authinfo__dialog" ref={dialogRef}>
          <div className="authinfo__dialog__box">
            <div className="authinfo__dialog__box__info">
              <img
                className="authinfo__dialog__box__info__whatsnew"
                src="/images/login/auth-whatsnew.svg"
                alt="whats new"
                width={140}
                height={32}
              />
              <h2 className="authinfo__dialog__box__info__title">New Authentication Method</h2>
              <p className="authinfo__dialog__box__info__text">
                We&apos;ve updated our authentication experience. You will need to login with your Directory profile
                email or link it to a login method of your choice. If you don&apos;t remember which email is tied to
                your Directory profile, please{' '}
                <a
                  data-testid="contact-us-link"
                  rel="noopener noreferrer"
                  className="link"
                  target="_blank"
                  href="https://www.plnetwork.io/contact?showModal=getSupport"
                >
                  contact us here
                </a>{' '}
                for assistance.
              </p>
              <button onClick={onLogin} className="authinfo__dialog__box__info__btn">
                Proceed to Login
              </button>
            </div>
            <button onClick={onClose}>
              <img width={20} height={20} src="/icons/close.svg" className="authinfo__dialog__box__close" alt="close" />
            </button>
            <img src={loginBanner} className="authinfo__dialog__box__img" alt="login banner" />
          </div>
          <div className="authinfo__dialog__actions">
            <button onClick={onClose} className="authinfo__dialog__actions__cancel">
              Cancel
            </button>
            <button onClick={onLogin} className="authinfo__dialog__actions__login">
              Proceed to Login
            </button>
          </div>
        </dialog>
      </div>

      <style>{`
          .authinfo {
            position: fixed;
            top: 0;
            z-index: 2000;
            right: 0;
            left: 0;
            width: 100svw;
            height: 100%;
            background: rgb(0, 0, 0, 0.6);
          }
          .authinfo__dialog {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            position: relative;
            align-items: center;
            justify-content: center;
            background:transparent; 
            border:none;
          }
          .authinfo__dialog__box {
            width: 90svw;
            max-height: calc(90svh - 72px);
            overflow-y: scroll;
            background: white;
            border-radius: 8px 8px 0px 0px;
            position: relative;
            padding: 8px;
            display: flex;
            flex-direction: column;
          }
          .authinfo__dialog__box__close {
            display: none;
          }
          .authinfo__dialog__box__info {
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .authinfo__dialog__box__info__title {
            font-size: 20px;
            font-weight: 700;
            line-height: 32px;
            margin-top: 12px;
            text-align: center;
          }
          .authinfo__dialog__box__img {
            width: 100%;
            border-radius: 6px;
          }
          .authinfo__dialog__box__info__text {
            font-size: 12px;
            font-weight: 400;
            text-align: center;
            line-height: 18px;
            padding: 16px 0;
          }
          .authinfo__dialog__actions {
            background: white;
            width: 90svw;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            height: 72px;
            border-radius: 0 0 8px 8px;
          }
          .authinfo__dialog__actions__cancel {
            padding: 10px 24px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            font-size: 14px;
            font-weight: 500;
            background:#fff;
          }
          .authinfo__dialog__actions__login {
            padding: 10px 24px;
            border-radius: 8px;
            background: #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
          }
          .authinfo__dialog__box__info__btn {
            display: none;
          }
          .link {
            color: #156ff7;
            font-weight: 600;
          }

          @media (min-width: 1024px) {
            .authinfo__dialog__actions {
              display: none;
            }
            .authinfo__dialog__box {
              flex-direction: row;
              height: 70svh;
              max-height: 598px;
              width: fit-content;
              overflow: hidden;
              border-radius: 8px;
            }
            .authinfo__dialog__box__img {
              order: 1;
              width: fit-content;
              height: 100%;
            }
            .authinfo__dialog__box__info {
              order: 2;
              max-width: 300px;
              flex: 1;
              height: 100%;
            }
            .authinfo__dialog__box__info__btn {
              display: flex;
              padding: 10px 24px;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              background: #156ff7;
              color: white;
            }
            .authinfo__dialog__box__close {
              position: absolute;
              top: 16px;
              right: 16px;
              display: block;
              cursor: pointer;
            }
          }
      
      `}</style>
    </>
  );
};

export default AuthInfo;
