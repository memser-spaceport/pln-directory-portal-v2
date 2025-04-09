'use client';
import React from 'react';
import { triggerLoader } from '@/utils/common.utils';
import { PAGE_ROUTES } from '@/utils/constants';
import { useRouter } from 'next/navigation';

const IntrosBanner: React.FC = () => {
  const router = useRouter();
  const onIntrosaiBtnClick = () => {
    triggerLoader(true);
    router.push(PAGE_ROUTES.INROS_AI);
  };

  return (
    <>
      <div className="intros-banner">
        <div className="intros-banner__title">
          <p className="intros-banner__title__text">Looking to connect? Get warm intros to the right people through our Intro Bot</p>
        </div>

        <div className="intros-banner__trigger">
          <button className="intros-banner__trigger__button" onClick={onIntrosaiBtnClick}>
            <img height={16} width={16} src="/icons/collab.svg" alt="collab" />
            <p className="intros-banner__trigger__button__text">Launch Intro AI</p>
          </button>
        </div>
      </div>

      <style jsx>
        {`
          .intros-banner {
            display: flex;
            gap: 10px;
            align-items: center;
            justify-content: center;
            min-height: 40px;
            flex-wrap: wrap;
            padding: 8px 0px;
            background: linear-gradient(75.2deg, #427dff 18.53%, #44d5bb 80.93%);
          }

          .intros-banner__title {
            font-family: Inter;
            font-weight: 500;
            font-size: 13px;
            color: #fff;
            text-align: center;
          }

          .intros-banner__trigger__button {
            background: #fff;
            border-radius: 4px;
            padding: 4px 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            gap: 4px;
            height: 24px;
          }
          .intros-banner__trigger__button__text {
            font-weight: 500;
            font-size: 13px;
            text-align: center;
            color: #156ff7;
          }
        `}
      </style>
    </>
  );
};

export default IntrosBanner;
