import { useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { deleteEventGuestByLocation, getGuestsByLocation } from '@/services/irl.service';
import { getParsedValue } from '@/utils/common.utils';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { getFormattedDateString } from '@/utils/irl.utils';
import RegsiterFormLoader from '@/components/core/register/register-form-loader';

const DeleteGuestsPopup = (props: any) => {
  const eventDetails = props?.eventDetails;
  const guests = eventDetails?.guests ?? [];
  const onClose = props?.onClose;
  const location = props.location;

  const selectedGuestIds = props?.selectedGuests ?? [];
  const selectedGuests = guests.filter((guest: any) => selectedGuestIds.includes(guest?.memberUid)) ?? [];
  const setSelectedGuests = props?.setSelectedGuests;

  const [selectedEvents, setSelectedEvents] = useState({}) as any;
  const router = useRouter();
  const analytics = useIrlAnalytics();

  const getEventDetails = async () => {
    const authToken = getParsedValue(Cookies.get('authToken'));
    const updatedEventDetails = await getGuestsByLocation(location?.uid, 'upcoming', authToken);
    document.dispatchEvent(
      new CustomEvent('updateGuests', {
        detail: {
          eventDetails: updatedEventDetails,
        },
      })
    );
    router.refresh();
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
  };

  const onDeleteGuests = async (e: any) => {
    e.preventDefault();
    const toast = (await import('react-toastify')).toast;
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    // analytics.removeAttendeesPopupRemoveBtnClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), selectedGuests });
    const authToken = getParsedValue(Cookies.get('authToken') || '');
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
        // analytics.removeAttendeesRemoveSuccess(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), selectedGuests });
      }
    } catch (err) {
      onClose();
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      console.log(err);
    }
  };

  // Handle selecting or deselecting all gatherings for all members
  const handleSelectAllGatherings = (isChecked: boolean) => {
    if (isChecked) {
      const allGatherings = {} as any;
      selectedGuests?.forEach((member: any) => {
        allGatherings[member?.memberUid] = member?.events?.map((g: any) => g?.uid);
      });
      setSelectedEvents(allGatherings);
    } else {
      setSelectedEvents({});
    }
  };

  // Handle selecting or deselecting all gatherings for an individual member
  const handleSelectMemberGatherings = (memberUid: string, isChecked: boolean) => {
    setSelectedEvents((prevSelected: any) => {
      const updatedGatherings = { ...prevSelected };

      if (isChecked) {
        // Add all gatherings for this member
        updatedGatherings[memberUid] = selectedGuests?.find((member: any) => member?.memberUid === memberUid).events?.map((gathering: any) => gathering?.uid);
      } else {
        // Remove all gatherings for this member
        delete updatedGatherings[memberUid];
      }

      return updatedGatherings;
    });
  };

  // Handle selecting or deselecting individual gatherings for a member
  const handleSelectGathering = (memberUid: string, gatheringId: string, isChecked: boolean) => {
    setSelectedEvents((prevSelected: any) => {
      const updatedGatherings = { ...prevSelected };

      if (isChecked) {
        // Add this gathering ID for this member
        updatedGatherings[memberUid] = updatedGatherings[memberUid] ? [...updatedGatherings[memberUid], gatheringId] : [gatheringId];
      } else {
        // Remove this gathering ID for this member
        updatedGatherings[memberUid] = updatedGatherings[memberUid]?.filter((id: string) => id !== gatheringId);

        // If no gatherings are left for this member, remove the member's key
        if (updatedGatherings[memberUid]?.length === 0) {
          delete updatedGatherings[memberUid];
        }
      }

      return updatedGatherings;
    });
  };

  // Utility function to check if all gatherings for a member are selected
  const areAllMemberGatheringsSelected = (memberUid: string) => {
    const memberGatherings = selectedGuests?.find((m: any) => m?.memberUid === memberUid)?.events;
    return selectedEvents[memberUid]?.length === memberGatherings.length || false;
  };

  // to check if a specific gathering is selected for a member
  const isGatheringSelected = (memberUid: string, gatheringId: string) => {
    return selectedEvents[memberUid]?.includes(gatheringId) || false;
  };

  return (
    <>
      <div className="dgp">
        <div className="dgp__hdr">
          <h3 className="dgp__hdr__ttl">Remove attendee from Gathering(s)</h3>
          <div className="dgp__hdr__info">
            <img src="/icons/info-red.svg" alt="info" />
            <span className="dgp__hdr__info__txt">Attendees will be removed from the list completely if all gatherings are selected for removal</span>
          </div>
        </div>
        <div className="dgp__body">
          <div className="dgp__body__selectAll">
            <div className="dgp__body__selectAll__checkboxWrpr">
              {Object.keys(selectedEvents).length === selectedGuests.length && (
                <button onClick={() => handleSelectAllGatherings(false)} className="notHappenedCtr__bdy__optnCtr__optn__sltd">
                  <img height={11} width={11} src="/icons/right-white.svg" alt="checkbox" />
                </button>
              )}
              {Object.keys(selectedEvents).length !== selectedGuests.length && <button onClick={() => handleSelectAllGatherings(true)} className="notHappenedCtr__bdy__optnCtr__optn__ntsltd"></button>}
            </div>
            <h3 className="dgp__body__selectAll__hdr__ttl">Check to select all gatherings</h3>
          </div>
          <div className="dgp__body__members">
            {selectedGuests?.map((guest: any, index: any) => {
              return (
                <>
                  <div className="dgp__body__member">
                    <div className="dgp__body__member__hdr">
                      <img height={24} width={24} src={guest.memberLogo || '/icons/default-user-profile.svg'} alt={guest.memberName} className="dgp__body__member__hdr__img" />
                      <span className="dgp__body__member__hdr__member-name">{guest.memberName}</span>
                    </div>

                    <div className="dgp__body__member__gatherings">
                      <div className="dgp__body__member__gatherings__hdr">
                        <div className="dgp__body__member__gatherings__checkboxWrpr">
                          {areAllMemberGatheringsSelected(guest?.memberUid) && (
                            <button onClick={() => handleSelectMemberGatherings(guest?.memberUid, false)} className="notHappenedCtr__bdy__optnCtr__optn__sltd">
                              <img height={11} width={11} src="/icons/right-white.svg" alt="checkbox" />
                            </button>
                          )}
                          {!areAllMemberGatheringsSelected(guest?.memberUid) && (
                            <button onClick={() => handleSelectMemberGatherings(guest?.memberUid, true)} className="notHappenedCtr__bdy__optnCtr__optn__ntsltd"></button>
                          )}
                        </div>
                        <div className="dgp__body__member__gatherings__hdr__ttlWrpr">
                          <h3 className="dgp__body__member__gatherings__hdr__ttl">Select gathering(s) that you want to remove</h3>
                        </div>
                      </div>
                      <div className="dgp__body__member__gatherings__list">
                        {guest?.events?.map((event: any) => (
                          <div key={event.id} className="dgp__body__member__gatherings__list__item">
                            <div className="dgp__body__member__gatherings__list__item__checkboxWrpr">
                              {isGatheringSelected(guest?.memberUid, event?.uid) && (
                                <button onClick={() => handleSelectGathering(guest?.memberUid, event?.uid, false)} className="notHappenedCtr__bdy__optnCtr__optn__sltd">
                                  <img height={11} width={11} src="/icons/right-white.svg" alt="checkbox" />
                                </button>
                              )}
                              {!isGatheringSelected(guest?.memberUid, event?.uid) && (
                                <button className="notHappenedCtr__bdy__optnCtr__optn__ntsltd" onClick={() => handleSelectGathering(guest?.memberUid, event?.uid, true)}></button>
                              )}
                            </div>
                            <div className="dgp__body__member__gatherings__list__item__gathering">
                              <span className="dgp__body__member__gatherings__list__item__gathering__date">{getFormattedDateString(event?.startDate, event?.endDate)}</span>
                              <div className="dgp__body__member__gatherings__list__item__gathering__wrpr">
                                <img height={20} width={20} src={event.logo} alt={event.name} className="dgp__body__member__gatherings__list__item__gathering__logo" />
                                <span className="dgp__body__member__gatherings__list__item__gathering__name">{event.name}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedGuests?.length !== index + 1 && <div className="divider"></div>}
                  </div>
                </>
              );
            })}
          </div>
        </div>
        <div className="dgp__footer">
          <button type="button" onClick={onClose} className="dgp__footer__cancel">
            Close
          </button>
          <button
            disabled={Object.keys(selectedEvents).length === 0}
            type="button"
            onClick={onDeleteGuests}
            className={`${Object.keys(selectedEvents).length === 0 ? 'disabled' : ''} dgp__footer__remove`}
          >
            Confirm Removal
          </button>
        </div>
      </div>
      <RegsiterFormLoader />
      <style jsx>{`
        .dgp {
          padding: 20px 10px 20px 20px;
          width: 89vw;
          max-height: 80svh;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .dgp__hdr {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-right: 10px;
        }

        .dgp__hdr__ttl {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          color: #0f172a;
        }

        .dgp__hdr__info {
          display: flex;
          align-items: center;
          background: #dd2c5a1a;
          padding: 8px 12px;
          border-radius: 4px;
          gap: 10px;
        }

        .dgp__hdr__info__txt {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
        }

        .dgp__body {
          border-radius: 8px;
          flex: 1;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px 10px 8px 0px;
        }

        .dgp__body__members {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dgp__body__selectAll {
          display: flex;
          align-items: center;
          border: 0.5px solid #cbd5e1;
          border-radius: 4px;
          height: 36px;
        }

        .dgp__body__selectAll__checkboxWrpr {
          padding: 8px 12px;
          border-radius: 4px 0px 0px 4px;
          outline: none;
        }

        .dgp__body__selectAll__hdr__ttl {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
          padding: 0px 12px;
        }

        .dgp__body__member {
          display: flex;
          flex-direction: column;
        }

        .dgp__body__member__hdr {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .dgp__body__member__hdr__img {
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: #f1f5f9;
        }

        .dgp__body__member__hdr__member-name {
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          text-align: left;
          color: #0f172a;
        }

        .dgp__body__member__gatherings {
          border: 0.5px solid #cbd5e1;
          border-radius: 4px;
          margin-top: 16px;
        }

        .dgp__body__member__gatherings__hdr {
          display: flex;
          border-bottom: 0.5px solid #cbd5e1;
        }

        .dgp__body__member__gatherings__checkboxWrpr {
          padding: 0px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 0.5px solid #cbd5e1;
          height: inherit;
        }

        .dgp__body__member__gatherings__hdr__ttl {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
          padding: 8px 12px;
        }

        .dgp__body__member__gatherings__list__item {
          display: flex;
        }

        .dgp__body__member__gatherings__list__item__checkboxWrpr {
          padding: 8px 12px;
          border-right: 0.5px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dgp__body__member__gatherings__list__item__gathering {
          padding: 8px 12px;
          display: flex;
          gap: 4px;
          flex-direction: column;
        }

        .dgp__body__member__gatherings__list__item__gathering__date {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
        }

        .dgp__body__member__gatherings__list__item__gathering__name {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          color: #0f172a;
        }

        .dgp__body__member__gatherings__list__item__gathering__wrpr {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .dgp__body__member__gatherings__list__item__gathering__logo {
          object-fit: cover;
          background: #f1f5f9;
        }

        .divider {
          border-bottom: 1px solid #cbd5e1;
          padding-top: 20px;
        }

        .disabled {
          opacity: 0.5;
        }

        .dgp__footer {
          display: flex;
          justify-content: end;
          gap: 10px;
          margin-top: 16px;
          padding-right: 10px;
        }

        .dgp__footer__cancel {
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

        .dgp__footer__remove {
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

        .notHappenedCtr__bdy__optnCtr__optn__sltd {
          height: 20px;
          width: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #156ff7;
          border: 1px solid transparent;
        }

        .notHappenedCtr__bdy__optnCtr__optn__ntsltd {
          height: 20px;
          width: 20px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          background: transparent;
          display: flex;
        }

        @media (min-width: 1024px) {
          .dgp {
            width: 656px;
            padding: 24px;
          }

          .dgp__body__member__gatherings__list__item__gathering {
            flex-direction: row;
            gap: 24px;
          }
        }
      `}</style>
    </>
  );
};

export default DeleteGuestsPopup;
