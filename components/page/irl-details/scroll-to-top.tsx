'use client';

import { useCommonAnalytics } from '@/analytics/common.analytics';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { useEffect, useState } from 'react';

interface IScrollToTop {
  pageName: string;
  userInfo: IUserInfo;
}

const ScrollToTop = (props: IScrollToTop) => {
  const pageName = props?.pageName;
  const userInfo = props?.userInfo;
  const [showTopBtn, setShowTopBtn] = useState(false);
  const analytics = useCommonAnalytics();

  useEffect(() => {
    const handler = () => {
      if (window.scrollY > 300) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };
    window.addEventListener('scroll', handler);

    return () => {
      window.removeEventListener('scroll', handler);
    };
  }, []);

  const scrollToTop = () => {
    analytics.goToTopBtnClicked(getAnalyticsUserInfo(userInfo), pageName);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {showTopBtn && (
        <button onClick={scrollToTop} className="scroll-to-top-button">
          <img src="/icons/up-arrow-black.svg" alt="arrow" />
          Go to Top
        </button>
      )}
      <style jsx>{`
        .scroll-to-top-button {
          position: fixed;
          bottom: 27px;
          right: 17px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 4px;
          border-radius: 68px;
          border: 1px solid #156ff7;
          background-color: #ffffff;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
        }

        @media (min-width: 1024px) {
          .scroll-to-top-button {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default ScrollToTop;
