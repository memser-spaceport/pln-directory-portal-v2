'use client';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { TEAM_OFFICE_HOURS_MSG, TOAST_MESSAGES } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const TeamOfficeHours = (props: any) => {
  const team = props?.team;
  const officeHours = team?.officeHours;
  const isLoggedIn = props?.isLoggedIn;
  const userInfo = props?.userInfo;

  const teamAnalytics = useTeamAnalytics();
  const router = useRouter();

  const onLoginClickHandler = () => {
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      teamAnalytics.onTeamDetailOfficeHoursLoginClicked(getAnalyticsTeamInfo(team));
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  };

  const onScheduleMeeting = () => {
    teamAnalytics.onScheduleMeetingClicked(getAnalyticsUserInfo(userInfo), getAnalyticsTeamInfo(team));
  };

  // const onLearnMoreBtnClick = () => {
  //   teamAnalytics.onLearnMoreClicked(getAnalyticsUserInfo(userInfo), getAnalyticsTeamInfo(team));
  // };

  return (
    <>
      <div className="office-hours">
        <div className="office-hours__left">
          <div className="office-hours__left__calendar">
            <img loading="lazy" alt="calendar" className="office-hours__left__calendar__icon" src="/icons/calendar.svg" />
          </div>
          {!isLoggedIn ? (
            <p className="office-hours__left__msg">
              {TEAM_OFFICE_HOURS_MSG} {team?.name}
            </p>
          ) : (
            <h2 className="office-hours__left__calendar__title">Office Hours</h2>
          )}
        </div>
        <div className="office-hours__right">
          {/* <a href={LEARN_MORE_URL} target="blank">
            <button onClick={onLearnMoreBtnClick} className="office-hours__right__learn-more">
              Learn more
              <img loading="lazy" alt="learn more" src="/icons/learn-more.svg" height={16} width={16} />
            </button>
          </a> */}
          {isLoggedIn && officeHours && (
            <a href={officeHours} target="blank" onClick={onScheduleMeeting}>
              <button className="office-hours__right__meeting">Schedule Meeting</button>
            </a>
          )}

          {isLoggedIn && !officeHours && (
            <button disabled className="office-hours__right__meeting cursor-default disabled">
              Not Available
            </button>
          )}

          {!isLoggedIn && (
            <button onClick={onLoginClickHandler} className="office-hours__right__meeting">
              Login to Schedule
            </button>
          )}
        </div>
      </div>
      <style jsx>{`
        .office-hours {
          padding: 16px;
          display: flex;
          flex-wrap: wrap;
          background: #f8fafc;
          border-radius: 12px;
          gap: 8px;
          margin: 4px 20px 20px 20px;
          align-items: center;
          justify-content: space-between;
        }

        .office-hours__left {
          display: flex;
          gap: 16px;
        }

        .office-hours__left__msg {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
        }

        .office-hours__left__msg__mem {
          width: 80px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .office-hours__right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .office-hours__left__calendar__icon {
          padding: 4px;
          display: flex;
          align-items: center;
          background: #dbeafe;
          border-radius: 4px;
        }

        .office-hours__right__learn-more {
          border: none;
          background: inherit;
          color: #000;
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          letter-spacing: 0px;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .office-hours__right__meeting {
          background: #fff;
          color: #000;
          box-shadow: 0px 1px 1px 0px #0f172a14;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 500;
          color: #000;
          line-height: 20px;
          letter-spacing: 0px;
          text-align: left;
        }

        .office-hours__left__calendar__title {
          font-size: 18px;
          font-weight: 600;
          line-height: 28px;
          letter-spacing: 0.01em;
          text-align: left;
          color: #000;
        }
        .cursor-default {
          cursor: default;
        }

        .disabled {
          opacity: 0.5;
        }
      `}</style>
    </>
  );
};

export default TeamOfficeHours;
