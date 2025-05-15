'use client';

import { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { useCommonAnalytics } from '@/analytics/common.analytics';

/**
 * Props for the CookieChecker component.
 * @interface ICookieChecker
 * @property {boolean} isLoggedIn - Indicates if the user is currently logged in.
 */
interface ICookieChecker {
  isLoggedIn: boolean;
}

/**
 * CookieChecker component monitors the user's session by checking the presence of a refreshToken cookie.
 * If the session expires (cookie is missing), it displays a modal dialog prompting the user to log in again.
 *
 * @component
 * @param {ICookieChecker} props - Component props
 * @returns {JSX.Element}
 */
const CookieChecker = (props: ICookieChecker) => {
  const isLoggedIn = props?.isLoggedIn;
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(isLoggedIn);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const analytics = useCommonAnalytics();

  /**
   * Handles closing the session expired dialog and reloads the page.
   */
  const onClose = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
    window.location.reload();
  };

  /**
   * Handles the login action when the user clicks the Login button in the dialog.
   * Tracks the event and redirects to the login section, then reloads the page.
   */
  const onLogin = () => {
    analytics.onSessionExpiredLoginClicked();
    window.location.href = `${window.location.pathname}${window.location.search}#login`;
    window.location.reload();
  };

  // Update local state if isLoggedIn prop changes
  useEffect(() => {
    setIsUserLoggedIn(isLoggedIn);
  }, [isLoggedIn]);

  // Effect to check for session expiry (missing refreshToken cookie)
  useEffect(() => {
    /**
     * Checks if the refreshToken cookie is missing while the user is logged in.
     * If so, shows the session expired dialog.
     */
    const checkCookieExpiry = () => {
      const cookie = Cookies.get('refreshToken');
      if (isUserLoggedIn && !cookie) {
        if (dialogRef.current) {
          dialogRef.current.showModal();
        }
      }
    };

    // Initial check when component mounts
    checkCookieExpiry();

    // Set up an interval to check every 10 minutes (600,000 milliseconds)
    const intervalId = setInterval(checkCookieExpiry, 600000);

    return () => clearInterval(intervalId);
  }, [isUserLoggedIn]);

  return (
    <>
      <dialog onClose={onClose} ref={dialogRef} className="session">
        <div className="session__cn">
          <div className="session__cn__hdr">
            <h6 className="session__cn__hdr__ttl">Session Expired</h6>
            <button onClick={onClose} className="session__cn__hdr__clsBtn">
              <img width={22} height={22} src="/icons/close.svg" alt="close" />
            </button>
          </div>
          <p className="session__cn__text">Your session has expired due to inactivity. Please login to continue</p>
          <div className="session__cn__actions">
            <button onClick={onLogin} className="session__cn__actions__cls__btn">
              Login
            </button>
          </div>
        </div>
      </dialog>
      <style jsx>
        {`
          .session {
            background: white;
            border-radius: 8px;
            border: none;
            width: 656px;
            margin: auto;
            outline: none;
          }

          .session:focus {
            outline: none;
          }

          .session__cn {
            padding: 24px;
          }

          .session__cn__hdr {
            position: relative;
            display: flex;
            align-items: center;
            flex-direction: row;
            gap: 8px;
            width: 100%;
          }
          .session__cn__hdr__ttl {
            color: #0f172a;
            font-size: 24px;
            font-weight: 700;
            line-height: 32px;
          }

          .session__cn__hdr__clsBtn {
            position: absolute;
            right: 0;
            top: 0;
            background: transparent;
          }

          .session__cn__text {
            font-weight: 400;
            padding-top: 18px;
            padding: 10px 0px 0px 0px;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .session__cn__actions {
            background: white;
            display: flex;
            align-items: center;
            gap: 10px;
            border-radius: 0 0 8px 8px;
            width: 100%;
            justify-content: center;
            margin-top: 24px;
          }

          .session__cn__actions__cls__btn {
            padding: 8px 24px;
            border-radius: 8px;
            border: 1px solid #156ff7;
            color: white;
            font-size: 14px;
            font-weight: 500;
            background-color: #156ff7;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
          }

          @media (min-width: 1024px) {
            .session__cn__actions {
              justify-content: end;
            }

            .session__cn__actions__cls__btn {
              width: 86px;
            }

            .session__cn__text {
              text-align: left;
              width: 600px;
            }

            .session__cn__hdr {
              width: 100%;
            }
          }
        `}
      </style>
    </>
  );
};

export default CookieChecker;
