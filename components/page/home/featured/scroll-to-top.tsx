'use client';

import { useCommonAnalytics } from '@/analytics/common.analytics';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { useEffect, useRef, useState } from 'react';

/**
 * Props for the ScrollToTop component.
 * @interface IScrollToTop
 * @property {string} pageName - The name of the current page for analytics.
 * @property {IUserInfo} userInfo - The user information for analytics.
 */
interface IScrollToTop {
  pageName: string;
  userInfo: IUserInfo;
}

const ScrollToTop = (props: IScrollToTop) => {
  const pageName = props?.pageName;
  const userInfo = props?.userInfo;

  // State to control button visibility
  const [showTopBtn, setShowTopBtn] = useState(false);
  // Analytics instance
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

  // Effect: Observe the .featured section to toggle button visibility
  useEffect(() => {
    const target = document.querySelector('.featured');
    if (!target) return;

    // IntersectionObserver callback: show button when .featured is in view
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowTopBtn(entry.isIntersecting);
      },
      {
        threshold: 0,
      }
    );

    observer.observe(target);

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Only show the button when showTopBtn is true */}
      {showTopBtn && (
        <button ref={buttonRef} onClick={scrollToTop} className="scroll-to-top-button">
          <img src="/icons/up-arrow-black.svg" alt="arrow" />
        </button>
      )}
      {/* Inline styles for the button */}
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
