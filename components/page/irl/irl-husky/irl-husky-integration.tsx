'use client';
import React from 'react';
import { PAGE_ROUTES } from '@/utils/constants';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
interface IrlHuskyIntegrationProps {
  currentLocation: any;
}

const IrlHuskyIntegration = ({ currentLocation }: IrlHuskyIntegrationProps) => {
  const analytics = useIrlAnalytics();
  const onChatWithHusky = () => {
    window.open(PAGE_ROUTES.HUSKY, '_blank');
    analytics.trackIrlToHuskyRedirectClicked(currentLocation);
  };

  return (
    <div className="root">
      <div className="root__irlhusky">
        <div className="root__irlhusky__text">
          Got questions? Chat with
          <span className="root__irlhusky__text--highlighted">Husky AI</span>
          for quick answers
        </div>
        <div className="root__irlhusky__btn" onClick={onChatWithHusky}>
          <img src="/icons/irl/irl-husky.svg" alt="husky" />
          <div className="root__irlhusky__btn__text">Launch Husky</div>
          <img src="/icons/irl/arrow-white.svg" alt="arrow" />
        </div>
      </div>
      <style jsx>{`
        .root {
          position: relative;
          background: url('/icons/irl/irl-husky-bg.svg');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .root::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 8px;
          border: 1.5px solid transparent;
          background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%) border-box;
          -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
        }

        .root__irlhusky {
          padding: 10px 12px;
          display: flex;
          justify-content: space-between;
        }

        .root__irlhusky__text {
          font-size: 14px;
          justify-content: center;
          align-items: center;
          display: flex;
          font-weight: 600;
          z-index: 3;
        }
        .root__irlhusky__text--highlighted {
          color: #156ff7;
          margin: 0px 5px;
          font-weight: 600;
        }
        .root__irlhusky__btn {
          width: 175px;
          height: 40px;
          background-color: #156ff7;
          border-radius: 5px;
          justify-content: center;
          align-items: center;
          display: flex;
          gap: 8px;
          cursor: pointer;
          z-index: 3;
        }
        .root__irlhusky__btn__text {
          color: #fff;
          font-size: 14px;
          font-weight: 600;
        }
        @media (max-width: 768px) {
          .root {
            background-image: url('/icons/irl/irl-husky-bg-mobile.svg');
          }
          .root::before {
            border-radius: 0px;
            border-right: none;
            border-left: none;
          }
          .root__irlhusky {
            padding: 12px;
            flex-direction: column;
            gap: 12px;
          }
          .root__irlhusky__text {
            display: block;
          }
        }
        @media (min-width: 1440px) {
          .root {
            width: 1244px;
          }
        }
        @media (min-width: 1920px) {
          .root {
            width: 1678px;
          }
        }

        @media (min-width: 2560px) {
          .root {
            width: 2240px;
          }
        }
      `}</style>
    </div>
  );
};

export default IrlHuskyIntegration;
