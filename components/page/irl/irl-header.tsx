'use client';

import { PAGE_ROUTES } from '@/utils/constants';

const IrlHeader = () => {
  return (
    <>
      <div className="irlheaderCnt">
        <div className="irlHeaderCntr">
          <div className="irlHeaderCntrLeft">
            <a href={PAGE_ROUTES.EVENTS}>
              <img src="/icons/rounded-left-arrow.svg" alt="Back To Events" />
            </a>
            <div className="irlHeader">IRL Gatherings</div>
          </div>
        </div>
        <div className="irlheaderCnt__text">
          Choose a destination to view upcoming gathering, attendees, resources & let the network know about your
          presence
        </div>
      </div>
      <style jsx>
        {`
          .irlHeader {
            font-size: 24px;
            font-weight: 600;
            line-height: 28px;
            padding-bottom: 5px;
            color: #374151;
          }

          .irlheaderCnt__text {
            font-size: 14px;
            font-weight: 400;
            color: #0f172a;
            margin-top: 8px;
          }

          .irlsubHeader {
            font-size: 14px;
            font-weight: 400;
            display: flex;
            align-items: center;
            border: 1px solid transparent;
            border-radius: 8px;
            gap: 10px;
            padding: 15px 12px;
            position: relative;
            overflow: visible;
            margin-top: 14px;
            background-image: url('/icons/irl.svg');
            background-repeat: no-repeat;
            background-position: center;
            background-size: cover;
          }

          .irlsubHeader::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 8px;
            padding: 1px;
            background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
            -webkit-mask:
              linear-gradient(#fff 0 0) content-box,
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
          }

          .irlsubHeader__text {
            font-size: 15px;
            font-weight: 500;
            line-height: 20px;
            color: #000000;
            flex: 1;
            position: relative;
            // z-index: 1;
          }

          .irlHeaderCntr {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .irlHeaderCntrLeft__left {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .irlHeaderCntrLeft {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .irlheaderCnt {
            padding: 18px 16px 10px 16px;
          }

          @media (min-width: 760px) {
            .irlsubHeader {
              padding: 12px 12px 12px 20px;
              gap: 10px;
            }

            .irlheaderCnt {
              padding: 24px 5px 15px 5px;
            }
          }
        `}
      </style>
    </>
  );
};

export default IrlHeader;
