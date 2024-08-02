'use client';

import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getAnalyticsEventInfo } from '@/utils/common.utils';

interface IHeaderStrip {
  eventDetails: any;
}

function HeaderStrip(props: IHeaderStrip) {
  const analytics = useIrlAnalytics();
  const eventDetails = props?.eventDetails;
  const requestFormLink = process.env.IRL_PGF_FORM_URL;

  const onNavigate = () => {
    analytics.infoStripJoinBtnClicked({ ...getAnalyticsEventInfo(eventDetails), url: requestFormLink });
    window.open(requestFormLink, '_blank');
  };

  return (
    <>
      <div className="hdrStrip">
        <div className="hdrStrip__info">
          <img width={16} height={16} className="hdrStrip__info__icon" src="/icons/info-orange.svg" alt="info" />
          Attending this event but aren&apos;t part of the network yet?{` `}
          <button onClick={onNavigate} className="hdrStrip__info__joinBtn">
            Join
          </button>
        </div>
      </div>
      <style jsx>{`
        .hdrStrip {
          margin-top: 18px;
          display: flex;
          width: 100%;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background-color: #ffe2c8;
          padding: 8px 20px;
          text-align: center;
          font-size: 14px;
          font-weight: 400;
        }

        .hdrStrip__info__joinBtn {
          margin-left: 4px;
          border-radius: 8px;
          background-color: white;
          padding: 6px 10px;
          font-size: 14px;
          font-weight: 500;
        }

        @media (min-width: 1024px) {
          .hdrStrip {
            margin-top: 0;
            flex-direction: row;
            border-radius: 8px;
          }

          .hdrStrip__info {
            display: flex;
            align-items: center;
          }

          .hdrStrip__info__icon {
            margin-right: 4px;
            margin-top: -2px;
            display: inline;
          }
        }
      `}</style>
    </>
  );
}

export default HeaderStrip;
