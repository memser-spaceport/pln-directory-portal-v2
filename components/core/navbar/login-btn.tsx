'use client';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { TOAST_MESSAGES } from '@/utils/constants';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const LoginBtn = () => {
  const authAnalytics = useAuthAnalytics();
  const router = useRouter();

  const onLoginClickHandler = () => {
    authAnalytics.onLoginBtnClicked();
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      if (window.location.pathname === '/sign-up') {
        router.push(`/#login`);
      } else {
        router.push(`${window.location.pathname}${window.location.search}#login`);
      }
    }
  };
  return (
    <>
      <button className="loginBtn" onClick={onLoginClickHandler}>
        Login
      </button>
      <style jsx>{`
        .loginBtn {
          display: flex;
          width: 64px;
          height: 100%;
          padding: 4px 8px;
          justify-content: center;
          align-items: center;
          gap: 10px;
          border-radius: 100px;
          background: linear-gradient(71deg, #427dff 8.43%, #44d5bb 87.45%), #156ff7;

          color: var(--Neutral-White, #fff);

          font-size: 12px;
          font-style: normal;
          font-weight: 500;
          line-height: 16px; /* 133.333% */
          letter-spacing: -0.2px;
          transition: all 0.2s ease;
        }

        .loginBtn:hover {
          filter: brightness(110%);
        }
      `}</style>
    </>
  );
};

export default LoginBtn;
