"use client"

import { PAGE_ROUTES } from "@/utils/constants";

const IrlHeader = () => {
  // TODO: Add analytics
  //  const analytics = useIrlAnalytics();
   
  //   const onViewPlEventsClick = () => {
  //     analytics.trackViewPLEventsClick();
  //   };
  
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
        <div className="irlsubHeader">Choose a destination to view upcoming gatherings, attendees, resources & let the network know about your presence</div>
      </div>
      <style jsx>
        {`
          .irlHeader {
            font-size: 24px;
            font-weight: 600;
            line-height: 28px;
            padding-bottom: 5px;
          }

          .irlsubHeader {
            font-size: 14px;
            font-weight: 400;
          }

          .irlHeaderCntr {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
          }

          .irlHeaderCntrLeft {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .irlheaderCnt {
            padding: 24px 15px 15px 15px;
          }

          @media (min-width: 360px) {
            .irlsubHeader {
              line-height: 22px;
            }
          }

          @media (min-width: 10240px) {
            .irlsubHeader {
              line-height: 28px;
            }
          }

          @media (max-width: 480px) {
            .irlHeaderCntr {
              flex-wrap: wrap;
              gap: 8px;
              margin-bottom: 8px;
            }

            .irlHeaderCntrRightText__desktop {
              display: none;
            }

            .irlHeaderCntrRightText__mobile {
              display: block;
            }
          }

          @media (min-width: 481px) {
            .irlHeaderCntrRightText__mobile {
              display: none;
            }

            .irlHeaderCntrRightText__desktop {
              display: block;
            }
          }
        `}
      </style>
    </>
  );
};

export default IrlHeader;
