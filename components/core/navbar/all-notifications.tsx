import Link from 'next/link';
import NotificationCard from './notification-card';
import { EVENTS, PAGE_ROUTES } from '@/utils/constants';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import { getAnalyticsNotificationInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { usePathname, useRouter } from 'next/navigation';

const AllNotifications = (props: any) => {
  const allNotifications = props?.allNotifications ?? [];
  const analytics = useNotificationAnalytics();
  const userInfo = props?.userInfo;
  const pathname = usePathname();

  const onSeeAllClickHanlder = () => {
    if(pathname !== PAGE_ROUTES.NOTIFICATIONS) {
      triggerLoader(true);
    analytics.onSeeAllNotificationsClicked(getAnalyticsUserInfo(userInfo));
    }
  };

  const onNotificationClickHandler = (notification: any) => {
    analytics.onNotificationCardClicked(getAnalyticsUserInfo(userInfo), getAnalyticsNotificationInfo(notification));

    document.dispatchEvent(
      new CustomEvent(EVENTS.TRIGGER_RATING_POPUP, {
        detail: {
          notification,
        },
      })
    );
  };

  return (
    <>
      <div className="allnot">
        <div className="allnot__head">
          <div className="allnot__head__right">
            <div className="allnot__head__right__ttl">All Notifications</div>
            <div className="allnot__head__right__count">{allNotifications.length}</div>
          </div>
        </div>

        {allNotifications.length > 0 && (
          <div className="allnot__body">
            {allNotifications?.map((notification: any, index: number) => (
              <button onClick={() => onNotificationClickHandler(notification)} className="allnot__body__ntifn" key={`notification-${index}`}>
                <NotificationCard notification={notification} />
              </button>
            ))}
          </div>
        )}

        {allNotifications.length === 0 && (
          <div className="allnotifins__empty">
            <img className="allnotifins__empty__icon" src="/icons/notification.svg" alt="notifications" />
            <div className="allnotifins__empty__ttl">No Notifications</div>
            <div className="allnotifins__empty__desc">You have no notifications right now. Please come back later</div>
          </div>
        )}

        <div className="allnot__body__ftr">
          <button type="button" className="allnot__body__ftr__allbtn">
            <Link onClick={onSeeAllClickHanlder} href={PAGE_ROUTES.NOTIFICATIONS}>
              See all notifications
            </Link>
          </button>
        </div>
      </div>

      <style jsx>
        {`
          button {
            background: inherit;
          }

          .allnot {
            max-height: 400px;
            display: flex;
            flex-direction: column;
            background-color: white;
            border-radius: 8px;
          }

          .allnot__head {
            height: 52px;
            padding: 16px;
          }

          .allnot__head__right {
            display: flex;
            gap: 4px;
            align-items: center;
          }

          .allnot__head__right__ttl {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .allnot__head__right__count {
            font-size: 12px;
            line-height: 14px;
            font-weight: 500;
            border-radius: 24px;
            padding: 2px 8px;
            color: white;
            background-color: #ff820e;
          }

          .allnot__body {
            overflow: auto;
            flex: 1;
          }

          .allnot__body__ntifn {
            border-top: 1px solid #e2e8f0;
          }

          .allnot__body__ntifn:hover {
            background-color: #F8FAFC;
          }

          .allnot__body__ftr {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 36px;
          }

          .allnot__body__ftr__allbtn {
            font-size: 14px;
            line-height: 20px;
            color: #156ff7;
            font-weight: 600;
          }

          .allnotifins__empty {
            padding: 30px 0px 30px 0px;
          }

          .allnotifins__empty__icon {
            height: 120px;
          }

          .allnotifins__empty {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
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
            text-align: center;
            padding: 0 30px;
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

          @media (min-width: 1024px) {
          }
        `}
      </style>
    </>
  );
};

export default AllNotifications;
