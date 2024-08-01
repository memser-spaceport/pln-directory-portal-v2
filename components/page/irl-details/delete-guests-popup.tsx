import { useIrlAnalytics } from '@/analytics/irl.analytics';
import RegsiterFormLoader from '@/components/core/register/register-form-loader';
import { deleteGuests, getEventDetailBySlug } from '@/services/irl.service';
import { getAnalyticsEventInfo, getAnalyticsUserInfo, getParsedValue } from '@/utils/common.utils';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const DeleteGuestsPopup = (props: any) => {
  const eventDetails = props?.eventDetails;
  const guests = eventDetails?.guests ?? [];
  const onClose = props?.onClose;
  const selectedGuestIds = props?.selectedGuests ?? [];
  const selectedGuests = guests.filter((guest: any) => selectedGuestIds.includes(guest?.uid)) ?? [];
  const setSelectedGuests = props?.setSelectedGuests;
  const userInfo = props?.userInfo;
  const totalSelectedGuests = selectedGuests.length;
  const areGuestsPlural = totalSelectedGuests > 1;

  const router = useRouter();
  const analytics = useIrlAnalytics();

  const getEventDetails = async () => {
    const authToken = getParsedValue(Cookies.get('authToken'));
    const updatedEventDetails = await getEventDetailBySlug(eventDetails.slugUrl, authToken);
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

  const onDeleteGuests = async (e:any) => {
    e.preventDefault();
    const toast = (await import('react-toastify')).toast;
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    analytics.removeAttendeesPopupRemoveBtnClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), selectedGuests });
    const authToken = getParsedValue(Cookies.get('authToken') || '');
    try {
      const deleteGuestsResponse = await deleteGuests(eventDetails.slugUrl, authToken, { guests: selectedGuestIds });
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
        analytics.removeAttendeesRemoveSuccess(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), selectedGuests });
      }
    } catch (err) {
      onClose();
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      console.log(err);
    }
  };

  return (
    <>
      <div className="dgp">
        <div className="dgp__hdr">
          <h3 className="dgp__hdr__ttl">{`Confirm remove ${areGuestsPlural ? 'attendees' : 'attendee'} (${totalSelectedGuests})`}</h3>
          <div className="dgp__hdr__info">
            <img src="/icons/info-red.svg" alt="info" />
            <span className="dgp__hdr__info__txt">You will not be able to revert this action</span>
          </div>
        </div>
        <div className="dgp__body">
          {selectedGuests?.map((guest: any, index: any) => {
            return <div className="dgp__body__guest" key={`delete-guest-${index}`}>{`${index + 1}) ${guest?.memberName}`}</div>;
          })}
        </div>
        <div className="dgp__footer">
          {/* <button type='button' onClick={onClose} className="dgp__footer__cancel">
            Cancel
          </button> */}
          <button type='button' onClick={onDeleteGuests} className="dgp__footer__remove">{`Remove ${totalSelectedGuests} ${areGuestsPlural ? 'Attendees' : 'Attendee'}`}</button>
        </div>
      </div>
      <RegsiterFormLoader />
      <style jsx>{`
        .dgp {
          padding: 24px;
          width: 90vw;
          max-height: 80svh;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .dgp__hdr {
          display: flex;
          flex-direction: column;
          gap: 20px;
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

        .dgp__body {
          background: #f1f5f9;
          padding: 12px;
          border-radius: 8px;
          max-height: 184px;
          flex: 1;
          overflow: auto;
          margin-top: 10px;
        }

        .dgp__body__guest {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color:#0F172A;
        }

        .dgp__footer {
          display: flex;
          justify-content: end;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
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
          width: 100%;
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
          width: 100%;
        }

        @media (min-width: 1024px) {
          .dgp {
            width: 656px;
            padding: 24px;
          }

          .dgp__footer {
            display: flex;
            flex-direction: row;
            justify-content: end;
            gap: 10px;
            margin-top: 16px;
          }

          .dgp__footer__cancel {
            width: unset;
          }

          .dgp__footer__remove {
            width: unset;
          }
        }
      `}</style>
    </>
  );
};

export default DeleteGuestsPopup;
