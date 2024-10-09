import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { IAnalyticsGuestLocation } from '@/types/irl.types';
import { IUserInfo } from '@/types/shared.types';
import { EVENTS, IAM_GOING_POPUP_MODES } from '@/utils/constants';

interface INoAttendees {
  location: IAnalyticsGuestLocation;
  onLogin: () => void;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

const NoAttendees = (props: INoAttendees) => {
  const isLoggedIn = props.isLoggedIn;
  const userInfo = props?.userInfo;
  const onLogin = props.onLogin;

  const analytics = useIrlAnalytics();

  const onRespondClick = () => {
    analytics.trackNoAttendeesStripRespondBtnClicked(location);
    if (!isLoggedIn) {
      onLogin();
    } else {
      document.dispatchEvent(new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, { detail: { isOpen: true, formdata: {member: userInfo}, mode: IAM_GOING_POPUP_MODES.ADD } }));
    }
  };

  return (
    <>
      <div className="attendee-list__no-attendees">
        <div className="attendee-list__no-attendees-content">
          <span className="attendee-list__member-icon">
            <img src="/icons/members-blue.svg" alt="members" />
          </span>
          <p className="attendee-list__no-attendees-text">
            <span className="attendee-list__respond" onClick={onRespondClick}>
              Respond
            </span>{' '}
            to break the ice! Your participation might inspire others to jump in!
          </p>
        </div>
      </div>
      <style jsx>{`
        .attendee-list__no-attendees {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: center;
          height: 54px;
          background-color: #fff;
          box-shadow: 0px 4px 4px 0px #0f172a0a;
          width: 100%;
          padding: 0px 20px;
        }

        .attendee-list__no-attendees-content {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .attendee-list__member-icon {
          background-color: #dbeafe;
          min-width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .attendee-list__respond {
          font-size: 13px;
          font-weight: 500;
          line-height: 15px;
          color: #156ff7;
          cursor: pointer;
        }

        .attendee-list__no-attendees-text {
          font-size: 13px;
          font-weight: 400;
          line-height: 15px;
          color: #0f172a;
        }

        @media (min-width: 1024px) {
          .attendee-list__no-attendees {
            border-radius: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default NoAttendees;
