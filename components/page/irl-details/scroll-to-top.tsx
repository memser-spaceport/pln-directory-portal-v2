'use client';

import { useCommonAnalytics } from '@/analytics/common.analytics';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { useEffect, useRef, useState } from 'react';

interface IScrollToTop {
  pageName: string;
  userInfo: IUserInfo;
}

const ScrollToTop = (props: IScrollToTop) => {
  const pageName = props?.pageName;
  const userInfo = props?.userInfo;
  const [showTopBtn, setShowTopBtn] = useState(false);
  const analytics = useCommonAnalytics();
  const buttonRef = useRef(null);

  const scrollToTop = (e: any) => {
    e.preventDefault();
    analytics.goToTopBtnClicked(getAnalyticsUserInfo(userInfo), pageName);
    const scrollableElement = document.querySelector('body');

    scrollableElement?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const target = document.querySelector('.featured');
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowTopBtn(entry.isIntersecting);
      },
      {
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {showTopBtn && (
        <button ref={buttonRef} onClick={scrollToTop} className="scroll-to-top-button">
          <img src="/icons/up-arrow-black.svg" alt="arrow" />
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
          justify-content: center;
          gap: 4px;
          border-radius: 50%;
          border: 1px solid #156ff7;
          background-color: #ffffff;
          height: 36px;
          width: 36px;
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
          box-shadow: 0px 2px 6px 0px #0f172a29;
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
