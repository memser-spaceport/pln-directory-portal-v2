'use client';
import HuskyEmptyChat from '@/components/core/husky/husky-empty-chat';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { DAILY_CHAT_LIMIT } from '@/utils/constants';
import { getParsedValue } from '@/utils/common.utils';

const Husky = () => {
  const [limitReached, setLimitReached] = useState<boolean>(false); // daily limit

  const checkIsLimitReached = () => {
    const userInfo = getParsedValue(Cookies.get('userInfo'));
    if (!userInfo) {
      const chatCount = parseInt(Cookies.get('dailyChats') || '0', 10);
      return DAILY_CHAT_LIMIT === chatCount;
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
          <h3 className="husky__hdr__title">Explore Teams, Members, Projects & Gatherings happening around the network</h3>
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
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .husky__hdr {
          margin-top: 31px;
        }

        .husky__hdr__title {
          font-size: 15px;
          font-weight: 500;
          line-height: 18.15px;
          text-align: center;
          color: #1e3a8a;
          width: 314px;
          z-index: 1;
          margin: 0px 0;
        }

        .husky_input {
          width: 100%;
        }

        @media (min-width: 1024px) {
          .husky {
            background-position: 50% 31px;
            background-size: 240px 235px;
          }

          .husky__hdr {
            margin-top: 71px;
          }
          .husky__hdr__title {
            font-size: 24px;
            font-weight: 500;
            line-height: 29.05px;
            width: 551px;
          }
        }
      `}</style>
    </>
  );
};

export default Husky;
