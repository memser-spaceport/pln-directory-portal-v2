'use client';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import Link from 'next/link';

const SignUpBtn = () => {
  const authAnalytics = useAuthAnalytics();

  const onLoginClickHandler = () => {
    authAnalytics.onLoginBtnClicked();
  };
  return (
    <>
      <Link
        href="/sign-up"
        onClick={onLoginClickHandler}
      >
        <button className="SignUpBtn">
          Sign Up
        </button>
      </Link>
      <style jsx>{`
        .SignUpBtn {
          background: transparent;
          color: #475569;
          font-size: 15px;
          line-height: 24px;
          font-weight: 600;
        }

        .SignUpBtn:hover {
          // box-shadow: 0 4px 4px 0 rgba(15, 23, 42, 0.04), 0 0 1px 0 rgba(15, 23, 42, 0.12), 0 0 0 2px rgba(21, 111, 247, 0.25); 
          color: #000000;
          // background: linear-gradient(71.47deg, #1a61ff 8.43%, #2cc3ae 87.45%);
        }
      `}</style>
    </>
  );
};

export default SignUpBtn;
