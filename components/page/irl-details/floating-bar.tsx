import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsEventInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';

interface IFloatingBar {
  onClose: () => void;
  selectedGuests: string[];
  userInfo: IUserInfo;
  eventDetails: any;
}

const FloatingBar = (props: IFloatingBar) => {
  //props
  const onClose = props?.onClose;
  const selectedGuests = props?.selectedGuests ?? [];
  const userInfo = props?.userInfo;
  const eventDetails = props?.eventDetails;

  //hooks
  const analytics = useIrlAnalytics();

  //Open Remove Guests Popup
  const onDeleteGuests = () => {
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_REMOVE_GUESTS_POPUP, {
        detail: {
          isOpen: true,
        },
      })
    );
    analytics.floatingBarDeleteBtnClicked(getAnalyticsUserInfo(userInfo), getAnalyticsEventInfo(eventDetails));
  };

  // Open Attendee Details Popup for Edit the guest
  const onEditGuest = () => {
    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
          type:'admin-edit',
          selectedGuest: selectedGuests[0], // Guest whose data will be edited
        },
      })
    );
    analytics.floatingBarEditBtnClicked(getAnalyticsUserInfo(userInfo), getAnalyticsEventInfo(eventDetails));
  };

  return (
    <>
      <div className="floatingBar">
        <div className="floatingBar__count">{selectedGuests?.length}</div>
        <div className="floatingBar__text">Attendee selected</div>
        <div className="floatingBar__actions">
          <div className="floatingBar__actions__manipulation">
            {selectedGuests?.length === 1 && (
              <button onClick={onEditGuest} className="floatingBar__actions__edit">
                <img src="/icons/edit-blue.svg" alt="edit" />
              </button>
            )}
            <button onClick={onDeleteGuests} className="floatingBar__actions__delete">
              <img src="/icons/delete.svg" alt="delete" />
            </button>
          </div>
          <div className="floatingBar__actions__closeWrpr">
            <button onClick={onClose} className="floatingBar__actions__close">
              <img src="/icons/close.svg" alt="close" />
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .floatingBar {
          height: 61px;
          width: 90vw;
          background: #fff;
          border-radius: 8px;
          display: flex;
          box-shadow: 0px 2px 6px 0px #00000029;
        }

        .floatingBar__count {
          background: #156ff7;
          padding: 0px 10px;
          gap: 10px;
          background: #156ff7;
          font-size: 28px;
          font-weight: 600;
          line-height: 22px;
          color: #fff;
          width: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px 0px 0px 8px;
        }

        .floatingBar__text {
          font-size: 16px;
          font-weight: 600;
          line-height: 22px;
          color: #0f172a;
          display: flex;
          align-items: center;
          flex: 1;
          padding: 0px 13px;
        }

        .floatingBar__actions {
          display: flex;
          padding: 12px;
        }

        .floatingBar__actions__manipulation {
          display: flex;
          gap: 20px;
          padding: 0px 19px 0px 0px;
        }

        .floatingBar__actions__closeWrpr {
          border-left: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
        }

        .floatingBar__actions__edit {
          background: transparent;
        }

        .floatingBar__actions__delete {
          background: transparent;
        }

        .floatingBar__actions__close {
          background: transparent;
          padding: 0px 6px 0px 19px;
        }

        @media (min-width: 1024px) {
          .floatingBar {
            width: 560px;
          }
        }
      `}</style>
    </>
  );
};

export default FloatingBar;
