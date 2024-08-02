import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsEventInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS, EVENT_TYPE } from '@/utils/constants';
import { canUserPerformAction, isPastDate } from '@/utils/irl.utils';

interface IJoinEventStrip {
  onLogin: () => void;
  isUserLoggedIn: boolean;
  isUserGoing: boolean | undefined;
  userInfo: IUserInfo;
  eventDetails: any;
}

const JoinEventStrip = (props: IJoinEventStrip) => {
  const onLogin = props?.onLogin;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const isUserGoing = props?.isUserGoing;
  const eventDetails = props?.eventDetails;
  const userInfo = props?.userInfo;
  const type = eventDetails?.type;
  const isPastEvent = isPastDate(eventDetails?.endDate);

  const analytics = useIrlAnalytics();

  const canUserAddAttendees = canUserPerformAction(userInfo.roles as string[], ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS);

  const onJoinClick = () => {
    analytics.joinEventImGoingClicked(getAnalyticsUserInfo(userInfo), getAnalyticsEventInfo(eventDetails));
    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
          type: 'add',
        },
      })
    );
  };

  const onLoginClick = () => {
    analytics.joinEventLoginBtnClicked(getAnalyticsEventInfo(eventDetails));
    onLogin();
  };

  const onAddMemberClick = () => {
    analytics.addNewMemberBtnClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails) });
    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
          isAllowedToManageGuests: true,
        },
      })
    );
  };

  return (
    <>
      <div className="joinEventStrip">
        <div className="joinEventStrip__info">
          <img src="/images/stars.svg" alt="stars image" />
          <p className="joinEventStrip__info__text">Kickstart the attendee list and let others know you&apos;re joining. Your presence could inspire others to join in too!</p>
        </div>
        <div className="joinEventStrip__btnWrpr">
          {isUserLoggedIn && canUserAddAttendees && !isPastEvent && (
            <button className="joinEventStrip__btnWrpr__add__btn" onClick={onAddMemberClick}>
              <img src="/icons/add-user-blue.svg" width={16} height={16} alt="add" />
              <span className="joinEventStrip__btnWrpr__add__btn__txt">Add Member</span>
            </button>
          )}
          {isUserLoggedIn && !isUserGoing && type !== EVENT_TYPE.INVITE_ONLY && !isPastEvent && (
            <button onClick={onJoinClick} className="joinEventStrip__btnWrpr__btn">
              I am going
            </button>
          )}
          {!isUserLoggedIn && (
            <button onClick={onLoginClick} className="joinEventStrip__btnWrpr__loginBtn">
              Login to Respond
            </button>
          )}
        </div>
      </div>
      <style jsx>{`
        .joinEventStrip {
          display: flex;
          align-items: center;
          flex-direction: column;
          background-color: #ffffff;
          gap: 24px;
          padding: 20px;
          height: 100%;
          border-radius: 8px;
        }

        .joinEventStrip__info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 2;
        }

        .joinEventStrip__info__text {
          font-size: 15px;
          font-weight: 400;
          line-height: 24px;
          color: #0f172a;
        }

        .joinEventStrip__btnWrpr {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .joinEventStrip__btnWrpr {
          display: flex;
          justify-content: end;
        }

        .joinEventStrip__btnWrpr__btn {
          height: 40px;
          background-color: #156ff7;
          color: #ffffff;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          border: 1px solid #cbd5e1;
        }

        .joinEventStrip__btnWrpr__btn:hover {
          background-color: #1d4ed8;
        }

        .joinEventStrip__btnWrpr__loginBtn {
          width: 100%;
          background-color: #156ff7;
          box-shadow: 0px 1px 1px 0px #0f172a14;
          border: 1px solid #cbd5e1;
          height: 40px;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          line-height: 20px;
          border-radius: 8px;
        }

        .joinEventStrip__btnWrpr__loginBtn:hover {
          background-color: #1d4ed8;
        }

        .joinEventStrip__btnWrpr__add__btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 1px solid #cbd5e1;
          background: #fff;
          height: 40px;
          padding: 10px 12px;
          border-radius: 8px;
        }

        .joinEventStrip__btnWrpr__add__btn__txt {
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          color: #0f172a;
          font-style: normal;
        }

        @media (min-width: 1024px) {
          .joinEventStrip {
            flex-direction: row;
          }

          .joinEventStrip__btnWrpr__btn {
            width: 119px;
          }

          .joinEventStrip__btnWrpr {
            flex: 1;
            gap: 12px;
          }

          .joinEventStrip__btnWrpr__loginBtn {
            width: 165px;
          }
        }
      `}</style>
    </>
  );
};

export default JoinEventStrip;
