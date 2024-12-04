'use client';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import Link from 'next/link';

const SignUpBtn = () => {
  const authAnalytics = useAuthAnalytics();

  const onLoginClickHandler = () => {
    authAnalytics.onLoginBtnClicked();
    window.location.href = '/sign-up';
  };
  return (
    <>
      <div onClick={onLoginClickHandler}>
        <button className="SignUpBtn">Sign up</button>
      </div>
      <style jsx>{`
        .SignUpBtn {
          background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
          box-shadow: 0px 1px 1px 0px #07080829;
          padding: 8px 12px;
          color: #ffffff;
          font-size: 14px;
          line-height: 24px;
          font-weight: 600;
          border-radius: 100px;
        }

        .SignUpBtn:hover {
          box-shadow: 0 4px 4px 0 rgba(15, 23, 42, 0.04), 0 0 1px 0 rgba(15, 23, 42, 0.12), 0 0 0 2px rgba(21, 111, 247, 0.25);
          background: linear-gradient(71.47deg, #1a61ff 8.43%, #2cc3ae 87.45%);
        }
      `}</style>
    </>
  );
};

export default SignUpBtn;
