'use client';

import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import NotificationCard from '@/components/core/navbar/notification-card';
import { getFollowUps } from '@/services/office-hours.service';
import { IFollowUp } from '@/types/officehours.types';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsNotificationInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { EVENTS, PAGE_ROUTES } from '@/utils/constants';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface IAllNotifications {
  notifications: IFollowUp[];
  userInfo: IUserInfo;
  authToken: string;
}
const AllNotifications = (props: IAllNotifications) => {
  const analytics = useNotificationAnalytics();
  const userInfo = props?.userInfo;
  const authToken = props?.authToken;

  const [notifications, setNotifications] = useState(props?.notifications ?? []);
  const onNotificationClickHandler = (notification: IFollowUp) => {
    analytics.onNotificationCardClicked(getAnalyticsUserInfo(userInfo), getAnalyticsNotificationInfo(notification));
    document.dispatchEvent(
      new CustomEvent(EVENTS.TRIGGER_RATING_POPUP, {
        detail: {
          notification,
        },
      })
    );
  };

  const onGoBackClickHandler = () => {
    triggerLoader(true);
  };

  useEffect(() => {
    async function getAllNotifications(e: any) {
      if (e?.detail?.status) {
        const response = await getFollowUps(userInfo.uid ?? '', authToken, 'PENDING,CLOSED');
        const result = response?.data ?? [];
        setNotifications(result);
      }
    }

    document.addEventListener(EVENTS.GET_NOTIFICATIONS, (e: any) => getAllNotifications(e));

    return function () {
      document.removeEventListener(EVENTS.GET_NOTIFICATIONS, (e: any) => getAllNotifications(e));
    };
  }, []);

  return (
    <>
      <div className="allnotifins">
        {notifications?.length === 0 && (
          <div className="allnotifins__empty">
            <img className="allnotifins__empty__icon" src="/icons/notification.svg" alt="notifications" />
            <div className="allnotifins__empty__ttl">No Notifications</div>
            <div className="allnotifins__empty__desc">You have no notifications right now. Please come back later</div>
            <button className="allnotifins__empty__backbtn">
              <Link
                onClick={onGoBackClickHandler}
                style={{ height: 'inherit', width: 'inherit', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                href={PAGE_ROUTES.TEAMS}
              >
                Go Back Home
              </Link>
            </button>
          </div>
        )}

        {notifications?.length > 0 && (
          <div className="allnotifins__con">
            <div className="allnotifins__con__header">
              <div className="allnotifins__con__header__ttl">All Notifications</div>

              <div className="allnotifins__con__header__count">{notifications?.length}</div>
            </div>

            <div>
              {notifications?.map((notification: any, index: number) => (
                <button onClick={() => onNotificationClickHandler(notification)} className="allnot__body__ntifn" key={`notification-${index}`}>
                  <NotificationCard notification={notification} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>
        {`
          button {
            background: inherit;
            outline: none;
          }

          .allnotifins {
            padding-bottom: 10px;
          }

          .allnotifins__empty__icon {
            width: 184px;
            height: 161px;
          }

          .allnotifins__empty {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 30px 0px 30px 0px;
          }

          .allnotifins__empty__ttl {
            font-size: 24px;
            line-height: 20px;
            font-weight: 600;
            margin-top: 38px;
          }

          .allnotifins__empty__desc {
            font-size: 14px;
            line-height: 20px;
            margin-top: 20px;
            font-weight: 400;
            width: 290px;
            text-align: center;
          }

          .allnotifins__empty__backbtn {
            margin-top: 25px;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            border: 1px solid #cbd5e1;
            background-color: #156ff7;
            color: white;
            height: 40px;
            width: 120px;
            border-radius: 8px;
            font-weight: 500;
            line-height: 20px;
          }

          .allnotifins__con__header {
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .allnotifins__con__header__ttl {
            font-size: 14px;
            line-height: 20px;
            font-weight: 600;
          }

          .allnotifins__con__header__count {
            background-color: #ff820e;
            border-radius: 24px;
            padding: 2px 8px;
            font-size: 12px;
            line-height: 14px;
            font-weight: 500;
            color: white;
          }

          .allnot__body__ntifn {
            border-top: 1px solid #e2e8f0;
            width: 100%;
          }

          .allnot__body__ntifn:hover {
            background-color:  #F8FAFC;

          }

          @media (min-width: 1024px) {
          }
        `}
      </style>
    </>
  );
};

export default AllNotifications;
