'use client';
import HuskyEmptyChat from '@/components/core/husky/husky-empty-chat';
import { useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { DAILY_CHAT_LIMIT } from '@/utils/constants';
import { getParsedValue } from '@/utils/common.utils';

const Husky = () => {
  const [limitReached, setLimitReached] = useState<boolean>(false); // daily limit check

  const [isShrunk, setIsShrunk] = useState(false); // Track whether header is shrunk

  const checkIsLimitReached = () => {
    const refreshToken = getParsedValue(Cookies.get('refreshToken'));
    if (!refreshToken) {
      const chatCount = parseInt(Cookies.get('dailyChats') || '0', 10);
      return DAILY_CHAT_LIMIT <= chatCount;
    }
    return false;
  };

  useEffect(() => {
    setLimitReached(checkIsLimitReached());
  });

  useEffect(() => {
    const element = document.getElementById('husky-home');

    if (!element) return;

    // Function to get rootMargin based on the viewport width
    const getRootMargin = () => {
      if (window.innerWidth < 1024) {
        // Mobile view
        return '-185px 0px 0px 0px'; // Adjust this value for mobile
      } else {
        // Desktop view
        return '-250px 0px 0px 0px'; // Adjust this value for desktop
      }
    };

    // Set the initial rootMargin
    let observer = new IntersectionObserver(
      ([entry]) => {
        console.log('IntersectionObserver entry:', entry);
        setIsShrunk(!entry.isIntersecting);
      },
      {
        root: null, // Default is the viewport
        threshold: 0, // Trigger as soon as the element exits the viewport
        rootMargin: getRootMargin(),
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div id="husky-home" className={`husky ${isShrunk ? 'husky--shrunk' : ''}`}>
        {/* Sentinel element to observe */}
        <div className="husky__hdr">
          <h3 className="husky__hdr__title">Explore Protocol Labs with Husky, an LLM-powered chatbot</h3>
        </div>
        <div className="husky_input">
          <HuskyEmptyChat isHidden={isShrunk} checkIsLimitReached={checkIsLimitReached} limitReached={limitReached} setLimitReached={setLimitReached} />
        </div>
      </div>
      <style jsx>{`
        .husky {
          height: 100%;
          width: 100%;
          background: linear-gradient(71.47deg, rgba(66, 125, 255, 0.1) 8.43%, rgba(68, 213, 187, 0.1) 87.45%);
          background-image: url('/images/husky/husky-banner.svg');
          background-repeat: no-repeat;
          background-position: 50% 15px;
          background-size: 200px 195px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          padding: 35px 0px 20px 0px;
        }

        .husky__hdr__title {
          font-size: 15px;
          font-weight: 500;
          line-height: 18.15px;
          text-align: center;
          color: #1e3a8a;
          width: 284px;
          z-index: 1;
          margin: 0px 0;
        }

        .husky--shrunk {
          padding: 35px 0px 0px 0px;
        }

        @media (min-width: 1024px) {
          .husky {
            background-position: 50% 31px;
            background-size: 240px 235px;
            padding: 80px 0px 35px 0px;
            gap: 36px;
            transition: padding 0.3s ease, gap 0.3s ease;
          }

          .husky--shrunk {
            padding: 62px 0px 0px 0px;
          }

          .husky__hdr__title {
            font-size: 24px;
            font-weight: 500;
            line-height: 29.05px;
            width: 464px;
          }
        }
      `}</style>
    </>
  );
};

export default Husky;
