import { Dispatch, SetStateAction, SyntheticEvent, useState } from 'react';

import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { deleteEventGuestByLocation } from '@/services/irl.service';
import { EVENT_TYPE, EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { getFormattedDateString } from '@/utils/irl.utils';
import RegsiterFormLoader from '@/components/core/register/register-form-loader';
import { IAnalyticsGuestLocation, IGuest, IGuestDetails, IIrlEvent } from '@/types/irl.types';
import { IUserInfo } from '@/types/shared.types';

interface IDeleteAttendeesPopup {
  eventDetails: IGuestDetails;
  location: IAnalyticsGuestLocation;
  type: string;
  userInfo: IUserInfo;
  selectedGuests?: string[];
  onClose: () => void;
  setSelectedGuests: Dispatch<SetStateAction<string[]>>;
  getEventDetails: any;
}

interface ISelectedEvents {
  [key: string]: string[];
}

const DeleteAttendeesPopup = (props: IDeleteAttendeesPopup) => {
  const eventDetails = props?.eventDetails;
  const guests = eventDetails?.guests ?? [];
  const onClose = props?.onClose;
  const location = props.location;
  const type = props?.type;
  const userInfo = props?.userInfo;
  const getEventDetails = props?.getEventDetails;

  const selectedGuestIds = type === 'self-delete' ? [userInfo?.uid] : props?.selectedGuests ?? [];
  const selectedGuests = type === 'self-delete' ? [eventDetails?.currentGuest] : guests?.filter((guest: IGuest) => selectedGuestIds?.includes(guest?.memberUid)) ?? [];
  const setSelectedGuests = props?.setSelectedGuests;

  const [selectedEvents, setSelectedEvents] = useState<ISelectedEvents>({});
  const analytics = useIrlAnalytics();

  const onDeleteGuests = async (e: SyntheticEvent) => {
    e.preventDefault();
    const toast = (await import('react-toastify')).toast;
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    if (type === 'self-delete') {
      analytics.trackSelfRemoveAttendeePopupConfirmRemovalBtnClicked(location);
    } else if (type === 'admin-delete') {
      analytics.trackAdminRemoveAttendeesPopupConfirmRemovalBtnClicked(location);
    }
    try {
      const membersAndEvents = Object.keys(selectedEvents).map((memberUid) => ({
        memberUid,
        events: selectedEvents[memberUid],
      }));
      const deleteGuestsResponse = await deleteEventGuestByLocation(location?.uid, { membersAndEvents: membersAndEvents });
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
          })
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

  // Handle selecting or deselecting all gatherings for all members
  const handleSelectAllGatherings = (isChecked: boolean) => {
    const updatedEvents = isChecked ? Object.fromEntries(selectedGuests?.map((member: IGuest) => [member?.memberUid, member?.events?.map((g: IIrlEvent) => g?.uid)])) : {};
    setSelectedEvents(updatedEvents);
  };

  // Handle selecting or deselecting all gatherings for an individual member
  const handleSelectMemberGatherings = (memberUid: string, isChecked: boolean) => {
    setSelectedEvents((prevSelected: ISelectedEvents) => {
      const updatedGatherings = { ...prevSelected };
      if (isChecked) {
        const memberEvents = selectedGuests?.find((member: IGuest) => member?.memberUid === memberUid)?.events?.map((gathering: IIrlEvent) => gathering?.uid) || [];
        updatedGatherings[memberUid] = memberEvents;
      } else {
        delete updatedGatherings[memberUid];
      }
      return updatedGatherings;
    });
  };

  // Handle selecting or deselecting individual gatherings for a member
  const handleSelectGathering = (memberUid: string, gatheringId: string, isChecked: boolean) => {
    setSelectedEvents((prevSelected: ISelectedEvents) => {
      const updated = { ...prevSelected };
      const memberEvents = updated[memberUid] || [];
      updated[memberUid] = isChecked ? [...memberEvents, gatheringId] : memberEvents.filter((id: string) => id !== gatheringId);
      if (!updated[memberUid]?.length) {
        delete updated[memberUid];
      }
      return updated;
    });
  };

  // Utility function to check if all gatherings for a member are selected
  const areAllMemberGatheringsSelected = (memberUid: string) => {
    const memberGatherings = selectedGuests?.find((m: any) => m?.memberUid === memberUid)?.events;
    return selectedEvents[memberUid]?.length === memberGatherings?.length || false;
  };

  // to check if a specific gathering is selected for a member
  const isGatheringSelected = (memberUid: string, gatheringId: string) => selectedEvents[memberUid]?.includes(gatheringId);

  const getTotalSelectedEvents = () => {
    return Object.keys(selectedEvents)?.reduce((total, memberUid) => {
      return total + selectedEvents[memberUid]?.length;
    }, 0);
  };

  const getTotalEvents = () => {
    return selectedGuests?.reduce((total, guest) => {
      return total + (guest?.events?.length || 0);
    }, 0);
  };

  const allEventsSelected = getTotalSelectedEvents() === getTotalEvents();

  return (
    <>
      <div className="popup">
        {/* Header */}
        <div className="popup__header">
          <h3 className="popup__header__title">Remove Attendee from Gathering(s)</h3>
          <div className="popup__header__info">
            <img src="/icons/info-red.svg" alt="info" />
            <span className="popup__header__info__text">
              {type === 'self-delete'
                ? 'You will be removed from the attendee list if you remove yourself from all gatherings.'
                : 'Attendees will be removed completely if all gatherings are selected for removal.'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="popup__body">
          {type === 'admin-delete' && (
            <div className="popup__body__select-all">
              <div className="popup__body__select-all__checkbox-wrapper">
                {allEventsSelected && (
                  <button onClick={() => handleSelectAllGatherings(false)} className="checkbox--selected">
                    <img height={11} width={11} src="/icons/right-white.svg" alt="checkbox" />
                  </button>
                )}
                {!allEventsSelected && <button onClick={() => handleSelectAllGatherings(true)} className="checkbox"></button>}
              </div>
              <h3 className="popup__body__select-all__title">Check to select all gatherings</h3>
            </div>
          )}

          {/* Members */}
          <div className="popup__body__members">
            {selectedGuests?.map((guest: IGuest, index: number) => {
              const events = guest?.events?.filter((event: IIrlEvent) => eventDetails?.events?.some((g: IIrlEvent) => g?.uid === event?.uid));
              return (
                <div className="popup__member" key={guest?.memberUid}>
                  {type === 'admin-delete' && (
                    <div className="popup__member__header">
                      <img height={24} width={24} src={guest.memberLogo || '/icons/default-user-profile.svg'} alt={guest.memberName} className="popup__member__header__img" />
                      <span className="popup__member__header__name">{guest.memberName}</span>
                    </div>
                  )}

                  {type === 'self-delete' && <div className="popup__member__gatherings__header__title">Select the gatherings that you are not attending</div>}

                  <div className="popup__member__gatherings">
                    {type === 'admin-delete' && (
                      <div className="popup__member__gatherings__header">
                        <div className="popup__member__gatherings__header__checkbox-wrapper">
                          {areAllMemberGatheringsSelected(guest?.memberUid) && (
                            <button onClick={() => handleSelectMemberGatherings(guest?.memberUid, false)} className="checkbox--selected">
                              <img height={11} width={11} src="/icons/right-white.svg" alt="checkbox" />
                            </button>
                          )}
                          {!areAllMemberGatheringsSelected(guest?.memberUid) && <button onClick={() => handleSelectMemberGatherings(guest?.memberUid, true)} className="checkbox"></button>}
                        </div>
                        <h3 className="popup__member__gatherings__header__title">Select gathering(s) that you want to remove</h3>
                      </div>
                    )}

                    <div className="popup__member__gatherings__list">
                      {events?.map((event: IIrlEvent) => (
                        <div key={event?.uid} className="popup__gathering">
                          <div className="popup__gathering__checkbox-wrapper">
                            <>
                              {isGatheringSelected(guest?.memberUid, event?.uid) && (
                                <button onClick={() => handleSelectGathering(guest?.memberUid, event?.uid, false)} className="checkbox--selected">
                                  <img height={11} width={11} src="/icons/right-white.svg" alt="checkbox" />
                                </button>
                              )}
                              {!isGatheringSelected(guest?.memberUid, event?.uid) && <button className="checkbox" onClick={() => handleSelectGathering(guest?.memberUid, event?.uid, true)}></button>}
                            </>
                          </div>

                          <div className="popup__gathering__details">
                            {event?.startDate && event?.endDate && <span className="popup__gathering__date">{getFormattedDateString(event?.startDate, event?.endDate)}</span>}
                            <div className="popup__gathering__details__info">
                              <div className="popup__gathering__info-wrapper">
                                <img height={20} width={20} src={event?.logo || '/icons/irl-event-default-logo.svg'} alt={event?.name} className="popup__gathering__logo" />
                                <span className="popup__gathering__name">{event.name}</span>
                              </div>
                              {event?.type === EVENT_TYPE.INVITE_ONLY && (
                                  <img src="/icons/invite-only-circle.svg" height={16} width={16} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {index + 1 < selectedGuests?.length && <div className="divider"></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="popup__footer">
          <button onClick={onClose} className="popup__footer__cancel">
            Close
          </button>
          <button
            disabled={!Object.keys(selectedEvents).length}
            onClick={onDeleteGuests}
            className={`popup__footer__confirm ${!Object.keys(selectedEvents).length ? 'popup__footer__confirm--disabled' : ''}`}
          >
            Confirm Removal
          </button>
        </div>
      </div>
      <RegsiterFormLoader />
      <style jsx>{`
        .popup {
          padding: 20px 10px 20px 20px;
          width: 89vw;
          max-height: 80svh;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
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

        .popup__body {
          border-radius: 8px;
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px 10px 8px 0px;
        }

        .popup__body__members {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .popup__body__select-all {
          display: flex;
          align-items: center;
          border: 0.5px solid #cbd5e1;
          border-radius: 4px;
          height: 36px;
        }

        .popup__body__select-all__checkbox-wrapper {
          padding: 8px 12px;
          border-radius: 4px 0px 0px 4px;
          outline: none;
        }

        .popup__body__select-all__title {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
          padding: 0px 12px;
        }

        .popup__member {
          display: flex;
          flex-direction: column;
        }

        .popup__member__header {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .popup__member__header__img {
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: #f1f5f9;
        }

        .popup__member__header__name {
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          text-align: left;
          color: #0f172a;
        }

        .popup__member__gatherings {
          border: 0.5px solid #cbd5e1;
          border-radius: 4px;
          margin-top: 16px;
        }

        .popup__member__gatherings__header {
          display: flex;
          border-bottom: 0.5px solid #cbd5e1;
        }

        .popup__member__gatherings__header__checkbox-wrapper {
          padding: 0px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 0.5px solid #cbd5e1;
          height: inherit;
        }

        .popup__member__gatherings__header__title {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
          padding: 8px 12px;
        }

        .popup__gathering {
          display: flex;
        }

        .popup__gathering__checkbox-wrapper {
          padding: 8px 12px;
          border-right: 0.5px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popup__gathering__details {
          padding: 8px 12px;
          display: flex;
          gap: 4px;
          flex-direction: column;
        }

        .popup__gathering__date {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
        }

        .popup__gathering__name {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
        }

        .popup__gathering__info-wrapper {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .popup__gathering__logo {
          object-fit: cover;
          background: #f1f5f9;
        }

        .divider {
          border-bottom: 1px solid #cbd5e1;
          padding-top: 20px;
        }

        .checkbox--selected {
          height: 20px;
          width: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #156ff7;
          border: 1px solid transparent;
        }

        .checkbox {
          height: 20px;
          width: 20px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          background: transparent;
          display: flex;
        }

        .popup__footer {
          display: flex;
          justify-content: end;
          gap: 10px;
          margin-top: 16px;
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
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popup__footer__confirm--disabled {
          opacity: 0.5;
        }

        .popup__gathering__details__info {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .popup {
            width: 656px;
            padding: 24px;
          }

          .popup__gathering__details {
            flex-direction: row;
            gap: 24px;
          }

          .popup__gathering__date {
            min-width: 120px;
          }
        }
      `}</style>
    </>
  );
};

export default DeleteAttendeesPopup;
