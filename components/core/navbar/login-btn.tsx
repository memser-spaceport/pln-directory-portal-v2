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
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  };
  return (
    <>
      <button className="loginBtn" onClick={onLoginClickHandler}>
        Login
      </button>
      <style jsx>{`
        .loginBtn {
          background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
          box-shadow: 0px 1px 1px 0px #07080829;
          padding: 8px 24px;
          color: #ffffff;
          font-size: 15px;
          line-height: 24px;
          font-weight: 600;
          border-radius: 100px;
        }
      `}</style>
    </>
  );
};

export default LoginBtn;
