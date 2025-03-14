import Cookies from 'js-cookie';

import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getGuestDetail } from '@/services/irl.service';
import { IAnalyticsGuestLocation, IGuest, IGuestDetails } from '@/types/irl.types';
import { getParsedValue, triggerLoader } from '@/utils/common.utils';
import { EVENTS, IAM_GOING_POPUP_MODES } from '@/utils/constants';
import { transformGuestDetail } from '@/utils/irl.utils';

interface IFloatingBar {
  onClose: () => void;
  selectedGuests: string[];
  location: IAnalyticsGuestLocation;
  eventDetails: IGuestDetails;
  searchParams: any;
}

const FloatingBar = (props: IFloatingBar) => {
  //props
  const onClose = props?.onClose;
  const selectedGuestIds = props?.selectedGuests ?? [];
  const guests = props?.eventDetails.guests ?? [];
  const selectedGuest = guests?.find((guest: IGuest) => selectedGuestIds[0] === guest?.memberUid);
  const location = props.location;
  const searchParams = props.searchParams;

  //variables
  const authToken = getParsedValue(Cookies.get('authToken'));
  const eventType = searchParams?.type === 'past' ? '' : 'upcoming';

  //hooks
  const analytics = useIrlAnalytics();

  //Open Remove Guests Popup
  const onDeleteGuests = () => {
    analytics.trackAdminRemoveAttendeesPopupOpen(location);
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_REMOVE_GUESTS_POPUP, {
        detail: {
          isOpen: true,
          type: 'admin-delete',
        },
      })
    );
  };

  // Open Attendee Details Popup for Edit the guest
  const onEditGuest = async () => {
    if (selectedGuest?.memberUid) {
      let guestDetails = await getGuestDetail(selectedGuest?.memberUid, location.uid, authToken, eventType);
      guestDetails = transformGuestDetail(guestDetails, []);
      
      const formData = {
        team: {
          name: guestDetails?.teamName,
          logo: guestDetails?.teamLogo,
          uid: guestDetails?.teamUid,
        },
        member: {
          name: guestDetails?.memberName,
          logo: guestDetails?.memberLogo,
          uid: guestDetails?.memberUid,
        },
        teamUid: guestDetails?.teamUid,
        events: guestDetails?.events,
        teams: guestDetails?.teams?.map((team: any) => {
          return { ...team, uid: team?.id };
        }),
        memberUid: guestDetails?.memberUid,
        additionalInfo: { checkInDate: guestDetails?.additionalInfo?.checkInDate || '', checkOutDate: guestDetails?.additionalInfo?.checkOutDate ?? '' },
        topics: guestDetails?.topics,
        reason: guestDetails?.reason,
        telegramId: guestDetails?.telegramId,
        officeHours: guestDetails?.officeHours ?? '',
      };

      document.dispatchEvent(new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, { detail: { isOpen: true, formdata: formData, mode: IAM_GOING_POPUP_MODES.EDIT } }));
      analytics.trackFloatingBarEditBtnClicked(location, { selectedGuests: selectedGuestIds });
    }
  };

  return (
    <>
      <div className="floatingBar">
        <div className="floatingBar__count">{selectedGuestIds?.length}</div>
        <div className="floatingBar__text">{`${selectedGuestIds?.length > 1 ? 'Attendees' : 'Attendee'} selected`}</div>
        <div className="floatingBar__actions">
          <div className="floatingBar__actions__manipulation">
            {selectedGuestIds?.length === 1 && (
              <button onClick={onEditGuest} className="floatingBar__actions__edit">
                <img src="/icons/edit-blue.svg" alt="edit" />
              </button>
            )}
            <button type="button" onClick={onDeleteGuests} className="floatingBar__actions__delete">
              <img src="/icons/delete.svg" alt="delete" />
            </button>
          </div>
          <div className="floatingBar__actions__closeWrpr">
            <button type="button" onClick={onClose} className="floatingBar__actions__close">
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
