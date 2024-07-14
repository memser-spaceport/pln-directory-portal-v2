'use client';

import { EVENT_TYPE } from '@/utils/constants';
import { formatIrlEventDate } from '@/utils/irl.utils';

const Banner = (props: any) => {
  const eventDetails = props?.eventDetails;
  const description = eventDetails?.description;
  const name = eventDetails?.name;
  const bannerUrl = eventDetails?.bannerUrl;
  const startDate = eventDetails?.startDate;
  const endDate = eventDetails?.endDate;
  const eventLocation = eventDetails?.eventLocation;

  const eventDateRange = formatIrlEventDate(startDate, endDate);
  return (
    <>
      <div className="banner">
        <div className="banner__imgWrpr">
          <img src={bannerUrl} className="banner__img" alt="banner" loading="lazy" />
        </div>
        <div className="banner__info">
          <p className="banner__info__ttl">{name}</p>
          <div className="banner__info__tags">
            {eventDetails?.type === EVENT_TYPE.INVITE_ONLY && (
              <div className="banner__info__tags__inviteOnly">
                <img src="/icons/invite-only.svg" alt="invite-only" width={16} />
                <p>Invite Only</p>
              </div>
            )}
            <div className="banner__info__tags__date">
              <img src="/icons/flat-calendar.svg" alt="calender" width={16} height={16} />
              <p>{eventDateRange}</p>
            </div>
            <div className="banner__info__tags__location">
              <img src="/icons/location.svg" alt="location" width={16} height={16} />
              <p title={eventLocation} className=" banner__info__tags__location__txt">
                {eventLocation}
              </p>
            </div>
          </div>
        </div>
        <div className="banner__desc" dangerouslySetInnerHTML={{ __html: description }}></div>
      </div>
      <style jsx>{`
        .banner {
          padding: 20px;
        }

        .banner__imgWrpr {
          height: 153px;
          width: 100%;
          border-radius: 8px;
          background: #e5e7eb;
        }

        .banner__img {
          height: 100%;
          width: 100%;
          object-fit: cover;
          object-position: center;
          border-radius: 8px;
        }

        .banner__info {
          display: flex;
          flex-direction: column;
          align-items: start;
          justify-content: space-between;
          gap: 4px;
        }

        .banner__info__ttl {
          font-size: 24px;
          font-weight: 700;
        }

        .banner__info__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .banner__info__tags__inviteOnly {
          height: 28px;
          display: flex;
          align-items: center;
          gap: 4px;
          border-radius: 24px;
          background-color: #f1f5f9;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          color: #0f12a;
        }

        .banner__info__tags__date {
          height: 28px;
          display: flex;
          align-items: center;
          gap: 4px;
          border-radius: 24px;
          background-color: #f1f5f9;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
        }

        .banner__info__tags__location {
          height: 28px;
          display: flex;
          align-items: center;
          gap: 4px;
          border-radius: 24px;
          background-color: #f1f5f9;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
        }

        .banner__info__tags__location__txt {
          height: 100%;
          max-width: 100px;
          over-flow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .banner__desc {
          margin: 10px 0px 0px 0px;
          font-size: 15px;
          line-height: 24px;
          color: #0f172a;
          padding-bottom: 12px;
        }

        @media (min-width: 1024px) {
          .banner__info {
            margin: 24px 0px 0px 0px;
            flex-direction: row;
            align-items: center;
          }

          .banner__info__tags__inviteOnly {
            order: 0;
          }

          .banner__info__tags__date {
            order: 1;
          }

          .banner__info__tags__location {
            order: 2;
          }
        }
      `}</style>
    </>
  );
};

export default Banner;
