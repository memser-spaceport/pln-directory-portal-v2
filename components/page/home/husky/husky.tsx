'use client';
import HuskyEmptyChat from '@/components/core/husky/husky-empty-chat';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { DAILY_CHAT_LIMIT } from '@/utils/constants';
import { getParsedValue } from '@/utils/common.utils';

const Husky = () => {
  const [limitReached, setLimitReached] = useState<boolean>(false); // daily limit check

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
  return (
    <>
      <div className="husky">
        <div className="husky__hdr">
          <h3 className="husky__hdr__title">Explore Protocol Labs with Husky, an LLM-powered chatbot</h3>
        </div>
        <div className="husky_input">
          <HuskyEmptyChat checkIsLimitReached={checkIsLimitReached} limitReached={limitReached} setLimitReached={setLimitReached} />
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

        @media (min-width: 1024px) {
          .husky {
            background-position: 50% 31px;
            background-size: 240px 235px;
            padding: 80px 0px 35px 0px;
            gap: 36px;
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
