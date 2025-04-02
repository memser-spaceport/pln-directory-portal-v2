"use client"

import { useIrlAnalytics } from "@/analytics/irl.analytics";
import { PAGE_ROUTES } from "@/utils/constants";

const IrlHeader = () => {
   const analytics = useIrlAnalytics();
   
    const onViewPlEventsClick = () => {
      analytics.trackViewPLEventsClick();
    };
  
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
          <div className="irlHeaderCntrRight">
            <div className="irlHeaderCntrRightText__mobile">
              Looking for all network events?
            </div>
            <div className="irlHeaderCntrRightText__desktop">
              Looking for all events across the network?
            </div>
            <a
              href={process.env.NEXT_PUBLIC_EVENTS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="irlHeaderCntrRight__link"
              onClick={onViewPlEventsClick}
            >
              View all Events
            </a>
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

          .irlHeaderCntrRight {
            display: flex;
            align-items: center;
            gap: 4px;
            border: 0.5px solid #156ff7;
            border-radius: 21px;
            background-color: #dbeafe;
            padding: 2px 8px 2px 10px;
          }

          .irlHeaderCntrRightText__mobile,
          .irlHeaderCntrRightText__desktop {
            font-weight: 400;
            font-size: 12px;
            color: #000000;
          }

          .irlHeaderCntrRight__link {
            font-weight: 600;
            font-size: 12px;
            color: #156FF7;
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
