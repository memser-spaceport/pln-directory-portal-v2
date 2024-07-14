import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getAnalyticsEventInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { EVENT_TYPE } from '@/utils/constants';

const JoinEventStrip = (props: any) => {
  const onLogin = props?.onLogin;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const isUserGoing = props?.isUserGoing;
  const eventDetails = props?.eventDetails;
  const userInfo = props?.userInfo;
  const type = eventDetails?.type;

  const analytics = useIrlAnalytics();

  const onJoinClick = () => {
    analytics.joinEventImGoingClicked(getAnalyticsUserInfo(userInfo), getAnalyticsEventInfo(eventDetails));
    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
        },
      })
    );
  };

  const onLoginClick = () => {
    analytics.joinEventLoginBtnClicked(getAnalyticsEventInfo(eventDetails));
    onLogin();
  };

  return (
    <>
      <div className="joinEventStrip">
        <div className="joinEventStrip__info">
          <img src="/images/stars.svg" alt="stars image" />
          <p className="joinEventStrip__info__text">Kickstart the attendee list and let others know you&apos;re joining. Your presence could inspire others to join in too!</p>
        </div>
        <div className="joinEventStrip__btnWrpr">
          {isUserLoggedIn && !isUserGoing && type !== EVENT_TYPE.INVITE_ONLY && (
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
          flex: 3;
        }

        .joinEventStrip__info__text {
          font-size: 15px;
          font-weight: 400;
          line-height: 24px;
          color: #0f172a;
        }

        .joinEventStrip__btnWrpr {
          width: 100%;
        }

        .joinEventStrip__btnWrpr {
          display: flex;
          justify-content: end;
        }

        .joinEventStrip__btnWrpr__btn {
          height: 40px;
          width: 100%;
          background-color: #156ff7;
          color: #ffffff;
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

        @media (min-width: 1024px) {
          .joinEventStrip {
            flex-direction: row;
          }

          .joinEventStrip__btnWrpr__btn {
            width: 119px;
          }

          .joinEventStrip__btnWrpr {
            flex: 1;
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
