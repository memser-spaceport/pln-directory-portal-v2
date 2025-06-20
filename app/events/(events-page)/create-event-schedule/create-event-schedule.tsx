'use client';
import React from 'react';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getUserInfo } from '@/utils/third-party.helper';

const CreateEventSchedule = () => {
  const userInfo = getUserInfo();
  const analytics = useIrlAnalytics();

  const onCreateEventScheduleClicked = () => {
    window.open(process.env.CREATE_SCHEDULE, '_blank');
    analytics.trackIrlToCreateEventScheduleRedirectClick(userInfo);
  };

  return (
    <div className="root">
      <div className="root__schedule">
        <div className="root__schedule__text">Now you can host and manage your own event schedules right here</div>
        <a href={process.env.CREATE_SCHEDULE} target="_blank" rel="noopener noreferrer" className="root__schedule__btn" onClick={onCreateEventScheduleClicked}>
          <img src="/icons/calendar-white.svg" alt="calendar" />
          <div className="root__schedule__btn__text">Create Schedule</div>
        </a>
      </div>
      <style jsx>{`
        .root {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 0px;
          background: url('/icons/irl/create-event-schedule.png');
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
        }

        .root::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 0px;
          border: 1.5px solid transparent;
          border-right: none;
          border-left: none;
          background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%) border-box;
          -webkit-mask:
            linear-gradient(#fff 0 0) padding-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
          z-index: 2;
        }
        .root__schedule {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          position: relative;
          z-index: 3;
        }
        .root__schedule__text {
          display: block;
          font-weight: 500;
          z-index: 3;
          font-size: 14px;
        }

        .root__schedule__text--highlighted {
          color: #156ff7;
          margin: 0px 5px;
          font-weight: 500;
          cursor: pointer;
        }
        .root__schedule__btn {
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
        .root__schedule__btn__text {
          color: #fff;
          font-size: 14px;
          font-weight: 600;
        }
        .root__schedule__btn:hover {
          background: #1d4ed8;
        }
        @media (min-width: 768px) {
          .root {
            border-radius: 8px;
          }
          .root::before {
            border-radius: 8px;
            border: 1.5px solid transparent;
          }
          .root__schedule {
            padding: 10px 12px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
          }
          .root__schedule__text {
            justify-content: center;
            align-items: center;
            display: flex;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateEventSchedule;
