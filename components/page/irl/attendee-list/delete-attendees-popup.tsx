import { Dispatch, SetStateAction, SyntheticEvent } from 'react';

import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { deleteEventGuestByLocation } from '@/services/irl.service';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import RegsiterFormLoader from '@/components/core/register/register-form-loader';
import { IAnalyticsGuestLocation, IGuest, IGuestDetails } from '@/types/irl.types';
import { IUserInfo } from '@/types/shared.types';
import { toast } from '@/components/core/ToastContainer';

interface IDeleteAttendeesPopup {
  eventDetails: IGuestDetails;
  location: IAnalyticsGuestLocation;
  type: string;
  userInfo: IUserInfo;
  selectedGuests?: string[];
  onClose: () => void;
  setSelectedGuests: Dispatch<SetStateAction<string[]>>;
  getEventDetails: any;
  searchParams: any;
  from: string;
}

const DeleteAttendeesPopup = (props: IDeleteAttendeesPopup) => {
  const currentGuest = props?.eventDetails?.currentGuest;
  const guests = props?.eventDetails?.guests ?? [];
  const onClose = props?.onClose;
  const location = props.location;
  const type = props?.type;
  const userInfo = props?.userInfo;
  const getEventDetails = props?.getEventDetails;

  const selectedGuestIds = type === 'self-delete' ? [userInfo?.uid] : (props?.selectedGuests ?? []);
  const selectedGuests =
    type === 'self-delete'
      ? [currentGuest]
      : (guests?.filter((guest: IGuest) => selectedGuestIds?.includes(guest?.memberUid)) ?? []);
  const setSelectedGuests = props?.setSelectedGuests;

  const analytics = useIrlAnalytics();

  const getMembersAndEvents = () => {
    return selectedGuests?.map((guest: IGuest) => ({
      memberUid: guest?.memberUid,
      events: [],
    })) || [];
  };

  const onDeleteGuests = async (e: SyntheticEvent) => {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    if (type === 'self-delete') {
      analytics.trackSelfRemoveAttendeePopupConfirmRemovalBtnClicked(location);
    } else if (type === 'admin-delete') {
      analytics.trackAdminRemoveAttendeesPopupConfirmRemovalBtnClicked(location);
    }
    try {
      const membersAndEvents = getMembersAndEvents();
      const deleteGuestsResponse = await deleteEventGuestByLocation(location?.uid, {
        membersAndEvents: membersAndEvents,
      });
      if (!deleteGuestsResponse) {
        onClose();
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      }
      if (deleteGuestsResponse) {
        await getEventDetails();

        document.dispatchEvent(
          new CustomEvent(EVENTS.OPEN_FLOATING_BAR, {
            detail: {
              isOpen: false,
            },
          }),
        );
        setSelectedGuests([]);
        onClose();
        toast.success(TOAST_MESSAGES.ATTENDEE_DELETED_SUCCESSFULLY);
        if (type === 'self-delete') {
          analytics.trackSelfRemovalGatheringsSuccess(location, { membersAndEvents });
        } else if (type === 'admin-delete') {
          analytics.trackAdminRemoveAttendeesSuccess(location, { membersAndEvents });
        }
      }
    } catch (err) {
      onClose();
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      if (type === 'self-delete') {
        analytics.trackSelfRemovalGatherigsFailed(location, { error: err });
      } else if (type === 'admin-delete') {
        analytics.trackAdminRemoveAttendeesFailed(location, { error: err });
      }
      console.log(err);
    }
  };

  const isMultipleGuests = selectedGuests?.length > 1;
  const guestCount = selectedGuests?.length || 0;
  const firstGuestName = selectedGuests?.[0]?.memberName || '';
  
  const title = type === 'self-delete' 
    ? `Remove Yourself from ${location?.name || ''} Gathering(s)`
    : isMultipleGuests
    ? `Remove Attendees from ${location?.name || ''} Gathering(s)`
    : `Remove Attendee from ${location?.name || ''} Gathering(s)`;
  
  const message = type === 'self-delete'
    ? 'You will be removed from the attendee list'
    : isMultipleGuests
    ? `${guestCount} members will be removed from the attendee list`
    : `${firstGuestName} will be removed from the attendee list`;

  return (
    <>
      <div className="popup">
        {/* Header */}
        <div className="popup__header">
          <h3 className="popup__header__title">{title}</h3>
          <div className="popup__header__info">
            <img src="/icons/info-red.svg" alt="info" />
            <span className="popup__header__info__text">{message}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="popup__footer">
          <button onClick={onClose} className="popup__footer__cancel">
            Close
          </button>
          <button onClick={onDeleteGuests} className="popup__footer__confirm">
            Confirm Removal
          </button>
        </div>
      </div>
      <RegsiterFormLoader />
      <style jsx>{`
        .popup {
          padding: 20px 10px 20px 20px;
          width: 89vw;
          display: flex;
          flex-direction: column;
        }

        .popup__header {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-right: 10px;
        }

        .popup__header__title {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          color: #0f172a;
        }

        .popup__header__info {
          display: flex;
          align-items: center;
          background: #dd2c5a1a;
          padding: 8px 12px;
          border-radius: 4px;
          gap: 10px;
        }

        .popup__header__info__text {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
        }

        .popup__footer {
          display: flex;
          justify-content: end;
          gap: 10px;
          margin-top: 24px;
          padding-right: 10px;
        }

        .popup__footer__cancel {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #0f172a;
          background: #fff;
          border: 1px solid #cbd5e1;
          padding: 10px 24px;
          border-radius: 8px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popup__footer__confirm {
          height: 40px;
          border-radius: 8px;
          padding: 10px 24px;
          background: #dd2c5a;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (min-width: 1024px) {
          .popup {
            width: 656px;
            padding: 24px;
          }
        }
      `}</style>
    </>
  );
};

export default DeleteAttendeesPopup;
