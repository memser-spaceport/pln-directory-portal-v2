'use client';

import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { createFollowUp, getFollowUps } from '@/services/office-hours.service';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, getParsedValue, triggerLoader } from '@/utils/common.utils';
import { EVENTS, LEARN_MORE_URL, OFFICE_HOURS_MSG, TOAST_MESSAGES } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const MemberOfficeHours = (props: any) => {
  const member = props?.member;
  const officeHours = member?.officeHours;
  const isLoggedIn = props?.isLoggedIn;
  const userInfo = props?.userInfo;

  const authAnalytics = useAuthAnalytics();
  const memberAnalytics = useMemberAnalytics();
  const router = useRouter();

  const onLoginClickHandler = () => {
    authAnalytics.onLoginBtnClicked();
    router.push(`${window.location.pathname}${window.location.search}#login`);
  };

  const onScheduleMeeting = async () => {
    const isLoggedInUser = userInfo?.uid === member?.id;
    try {
      triggerLoader(true);
      const authToken = Cookies.get('authToken') || '';
      const response: any = await createFollowUp(userInfo.uid, getParsedValue(authToken), {
        data: {},
        hasFollowUp: true,
        type: 'SCHEDULE_MEETING',
        targetMemberUid: member.id,
      });

      if (response?.error) {
        triggerLoader(false);
        if (response?.error?.data?.message?.includes('yourself is forbidden')) {
          toast.error(TOAST_MESSAGES.SELF_INTERACTION_FORBIDDEN);
        }

        if(response?.error?.data?.message?.includes('Interaction with same user within 30 minutes is forbidden')) {
          toast.error(TOAST_MESSAGES.INTERACTION_RESTRICTED);
        }
        return;
      }
      triggerLoader(false);
      window.open(officeHours, '_blank');
      const allFollowups = await getFollowUps(userInfo.uid ?? '', getParsedValue(authToken), "PENDING,CLOSED");
      if (!allFollowups?.error) {
        const result = allFollowups?.data ?? [];
        if (result.length > 0) {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_RATING_POPUP, { detail: { notification: result[0] } }));
          document.dispatchEvent(new CustomEvent(EVENTS.GET_NOTIFICATIONS, { detail: {status: true, isShowPopup: false} }));
          router.refresh();
        }
      }
    } catch (error) {
      triggerLoader(false);
      console.error(error);
    }
    memberAnalytics.onOfficeHourClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
  };

  const onLearnMoreBtnClick = () => {
    memberAnalytics.onLearnMoreClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
  };

  return (
    <>
      <div className="office-hours">
        <div className="office-hours__left">
          <div className="office-hours__left__calendar">
            <img loading="lazy" alt="calendar" className="office-hours__left__calendar__icon" src="/icons/calendar.svg" />
          </div>
          {!isLoggedIn ? (
            <span suppressHydrationWarning className="office-hours__left__msg">
              {OFFICE_HOURS_MSG} {member?.name}
            </span>
          ) : (
            <h2 className="office-hours__left__calendar__title">Office Hours</h2>
          )}
        </div>
        <div className="office-hours__right">
          <a href={LEARN_MORE_URL} target="blank">
            <button onClick={onLearnMoreBtnClick} className="office-hours__right__learn-more">
              Learn more
              <img loading="lazy" alt="learn more" src="/icons/learn-more.svg" height={16} width={16} />
            </button>
          </a>
          {isLoggedIn && officeHours && (
            <div onClick={onScheduleMeeting}>
              <button className="office-hours__right__meeting">Schedule Meeting</button>
            </div>
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
          margin: 20px;
          align-items: center;
          justify-content: space-between;
        }

        .office-hours__left {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .office-hours__left__msg {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          word-break: break-word;
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

        @media (min-width: 1024px) {
          .office-hours__left__msg {
            max-width: 400px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            display: inline-block;
          }
        }
      `}</style>
    </>
  );
};

export default MemberOfficeHours;
