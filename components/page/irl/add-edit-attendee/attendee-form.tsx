import React, { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { IIrlAttendeeFormErrors, IIrlGathering, IIrlGuest, IIrlLocation, IIrlParticipationEvent } from '@/types/irl.types';
import { IUserInfo } from '@/types/shared.types';
import { ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS, EVENTS, IAM_GOING_POPUP_MODES, IRL_ATTENDEE_FORM_ERRORS, TOAST_MESSAGES } from '@/utils/constants';
import { canUserPerformEditAction } from '@/utils/irl.utils';
import { isLink } from '@/utils/third-party.helper';
import RegisterFormLoader from '@/components/core/register/register-form-loader';
import AttendeeDetails from './attendee-details';
import AttendeeFormErrors from './attendee-form-errors';
import ArrivalAndDepatureDate from './arrival-depature-date';
import Gatherings from './gatherings';
import OfficeHours from './office-hours';
import TelegramHandle from './telegram-handle';
import Topics from './topics';
import TopicsDescription from './topics-description';
import { createEventGuest, editEventGuest } from '@/services/irl.service';

interface IAttendeeForm {
  selectedLocation: IIrlLocation;
  userInfo: IUserInfo | null;
  allGatherings: any;
  defaultTags: string[];
  mode: string;
  allGuests: any;
  onClose: () => void;
  scrollTo: string;
  formData: any;
}

const AttendeeForm: React.FC<IAttendeeForm> = (props) => {
  const ref = useRef<HTMLDialogElement>(null);

  const mode = props?.mode;
  const selectedLocation = props?.selectedLocation;
  const gatherings = props?.allGatherings;
  const userInfo = mode === IAM_GOING_POPUP_MODES.ADMINADD ? null : {name: props?.formData?.member?.name, uid: props?.formData?.member?.uid, roles: props?.formData?.member?.roles}; 
  const defaultTags = props?.defaultTags;
  const allGuests = props?.allGuests;
  const onClose = props?.onClose;
  const scrollTo = props?.scrollTo;

  const [formInitialValues, setFormInitialValues] = useState<any>(props?.formData);
  const isAllowedToManageGuests = canUserPerformEditAction(userInfo?.roles ?? [], ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS);

  const [errors, setErrors] = useState<IIrlAttendeeFormErrors>({
    gatheringErrors: [],
    participationErrors: [],
    dateErrors: [],
  });

  const attendeeFormRef = useRef<HTMLFormElement>(null);
  const formBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.showModal();
    }
  }, []);

  const onFormSubmitHandler = async (e: FormEvent) => {
    e.preventDefault();

    let isError = false;
    if (!attendeeFormRef.current) {
      return;
    }
    const formData = new FormData(attendeeFormRef.current);
    const formattedData = transformObject(Object.fromEntries(formData));

    if (formattedData.events.length === 0) {
      isError = true;
      setErrors((prev: IIrlAttendeeFormErrors) => ({ ...prev, participationError: [], gatheringErrors: Array.from(new Set([...prev?.gatheringErrors, IRL_ATTENDEE_FORM_ERRORS.SELECT_GATHERING])) }));
    } else {
      let participationErrors: string[] = [];
      console.log("formattedDate", formattedData?.events);
      formattedData?.events?.map((event: any) => {
        event?.hostSubEvents?.map((hostSubEvent: IIrlParticipationEvent) => {
          if (!hostSubEvent?.name.trim()) {
            isError = true;
            participationErrors.push(`${hostSubEvent?.uid}-name`);
          }
          if (!isLink(hostSubEvent?.link)) {
            isError = true;
            participationErrors.push(`${hostSubEvent?.uid}-link`);
          }
        });

        event?.speakerSubEvents?.map((speakerSubEvent: IIrlParticipationEvent) => {
          if (!speakerSubEvent?.name.trim()) {
            isError = true;
            participationErrors.push(`${speakerSubEvent?.uid}-name`);
          }
          if (!isLink(speakerSubEvent?.link.trim())) {
            isError = true;
            participationErrors.push(`${speakerSubEvent?.uid}-link`);
          }
        });
      });
      setErrors((prev: IIrlAttendeeFormErrors) => ({ ...prev, gatheringErrors: [], participationErrors: Array.from(new Set([...participationErrors])) }));
    }

    if (!formattedData?.memberUid) {
      isError = true;
      setErrors((prev: IIrlAttendeeFormErrors) => ({ ...prev, gatheringErrors: Array.from(new Set([...prev?.gatheringErrors, IRL_ATTENDEE_FORM_ERRORS.SELECT_MEMBER])) }));
    }

    if (formattedData.additionalInfo.checkInDate && !formattedData.additionalInfo.checkOutDate) {
      isError = true;
      setErrors((prev: IIrlAttendeeFormErrors) => ({ ...prev, dateErrors: Array.from(new Set([IRL_ATTENDEE_FORM_ERRORS.CHECKOUT_DATE_REQUIRED])) }));
    } else if (formattedData.additionalInfo.checkOutDate && !formattedData.additionalInfo.checkInDate) {
      isError = true;
      setErrors((prev: IIrlAttendeeFormErrors) => ({ ...prev, dateErrors: Array.from(new Set([IRL_ATTENDEE_FORM_ERRORS.CHECKIN_DATE_REQUIRED])) }));
    } else if (formattedData.additionalInfo.checkInDate && formattedData.additionalInfo.checkOutDate) {
      const checkInDate = new Date(formattedData.additionalInfo.checkInDate);
      const checkOutDate = new Date(formattedData.additionalInfo.checkOutDate);
      if (checkInDate > checkOutDate) {
        isError = true;
        setErrors((prev: IIrlAttendeeFormErrors) => ({ ...prev, dateErrors: Array.from(new Set([IRL_ATTENDEE_FORM_ERRORS.DATE_DIFFERENCE])) }));
      } else {
        setErrors((prev: IIrlAttendeeFormErrors) => ({ ...prev, dateErrors: [] }));
      }
    } else {
      setErrors((prev: IIrlAttendeeFormErrors) => ({ ...prev, dateErrors: [] }));
    }
    if (isError) {
      formScroll();
      return;
    }

    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    const isUpdate = allGuests?.some((guest: any) => guest.memberUid === formInitialValues?.memberUid);

    if ((mode === IAM_GOING_POPUP_MODES.ADMINADD || mode === IAM_GOING_POPUP_MODES.ADD) && !isUpdate) {
      const result = await createEventGuest(selectedLocation.uid, formattedData);
      if (result.error) {
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        onClose();
        toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        return;
      }
      document.dispatchEvent(new CustomEvent('updateGuests'));
      onClose();
      if (isAllowedToManageGuests) {
        toast.success(TOAST_MESSAGES.ATTENDEE_ADDED_SUCCESSFULLY);
      } else {
        toast.success(TOAST_MESSAGES.DETAILS_ADDED_SUCCESSFULLY);
      }
    } else if (mode === IAM_GOING_POPUP_MODES.EDIT || isUpdate) {
      const result = await editEventGuest(selectedLocation.uid, formInitialValues?.memberUid, formattedData);
      if (result?.error) {
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        onClose();
        toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        return;
      }
      document.dispatchEvent(new CustomEvent('updateGuests'));
      onClose();
      if (isAllowedToManageGuests) {
        toast.success(TOAST_MESSAGES.ATTENDEE_UPDATED_SUCCESSFULLY);
      } else {
        toast.success(TOAST_MESSAGES.DETAILS_UPDATED_SUCCESSFULLY);
      }
    }
  };

  const formScroll = () => {
    if (formBodyRef.current) {
      formBodyRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  function transformObject(formValues: any) {
    let result: any = {};
    let events: any[] = [];
    let additionalInfo: any = {};
    let topics: any = [];

    for (const key in formValues) {
      if (key.startsWith('events')) {
        const [event, subKey] = key.split('-');
        const eventIndexMatch = event.match(/\d+$/);
        if (eventIndexMatch) {
          const eventIndex: any = eventIndexMatch[0];
          if (!events[eventIndex]) {
            events[eventIndex] = {};
          }
          if (formValues[key].trim()) {
            events[eventIndex][subKey] = formValues[key];
            events[eventIndex]['isHost'] = false;
            events[eventIndex]['isSpeaker'] = false;
            events[eventIndex]['hostSubEvents'] = [];
            events[eventIndex]['speakerSubEvents'] = [];
          }
        }
      } else if (key.startsWith('isHost')) {
        const eventUid = key.split('-')[1];
        events = structuredClone([...events]).filter((g) => g);
        const eventIndex = [...events].findIndex((event) => event.uid === eventUid);
        if (eventIndex !== -1) {
          events[eventIndex].isHost = formValues[key] === 'true';
        }
      } else if (key.startsWith('isSpeaker')) {
        const eventUid = key.split('-')[1];
        events = structuredClone([...events]).filter((g) => g);
        const eventIndex = [...events].findIndex((event) => event.uid === eventUid);
        if (eventIndex !== -1) {
          events[eventIndex].isSpeaker = formValues[key] === 'true';
        }
      } else if (key.startsWith('hostSubEvent')) {
        const [_, eventUid, subEventId, subEventKey] = key.split('-');
        events = structuredClone([...events]).filter((g) => g);
        const eventIndex = [...events].findIndex((event) => event.uid === eventUid);
        if (eventIndex !== -1) {
          const hostSubEventIndex = events[eventIndex].hostSubEvents.findIndex((subEvent: any) => subEvent.uid === subEventId);
          if (hostSubEventIndex !== -1) {
            events[eventIndex].hostSubEvents[hostSubEventIndex][subEventKey] = formValues[key].trim();
          } else {
            const newHostSubEvent = {
              uid: subEventId,
              [subEventKey]: formValues[key].trim(),
            };
            events[eventIndex].hostSubEvents.push(newHostSubEvent);
          }
        }
      } else if (key.startsWith('speakerSubEvent')) {
        const [_, eventUid, subEventId, subEventKey] = key.split('-');
        events = structuredClone([...events]).filter((g) => g);
        const eventIndex = [...events].findIndex((event) => event.uid === eventUid);
        if (eventIndex !== -1) {
          const speakerSubEventIndex = events[eventIndex].speakerSubEvents.findIndex((subEvent: any) => subEvent.uid === subEventId);
          if (speakerSubEventIndex !== -1) {
            events[eventIndex].speakerSubEvents[speakerSubEventIndex][subEventKey] = formValues[key].trim();
          } else {
            const newSpeakerSiubEvent = {
              uid: subEventId,
              [subEventKey]: formValues[key].trim(),
            };
            events[eventIndex].speakerSubEvents.push(newSpeakerSiubEvent);
          }
        }
      } else if (key.startsWith('checkInDate') || key.startsWith('checkOutDate')) {
        additionalInfo[key] = formValues[key];
      } else if (key.startsWith('topics')) {
        topics = [...topics, formValues[key]];
      } else {
        result[key] = formValues[key];
      }
    }

    result = { ...result, events: [...events].filter((g) => g), additionalInfo, topics };

    return result;
  }

  useEffect(() => {
    if (scrollTo && formBodyRef.current) {
      const section = formBodyRef.current.querySelector(`#${scrollTo}`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="attndformcnt">
      <RegisterFormLoader />
      <form noValidate onSubmit={onFormSubmitHandler} ref={attendeeFormRef} className="atndform">
        <button type="button" className="modal__cn__closebtn" onClick={onClose}>
          <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
        </button>
        <div className="atndform__bdy" ref={formBodyRef}>
          <h2 className="atndform__bdy__ttl">Enter Attendee Details</h2>
          <AttendeeFormErrors errors={errors} />
          <div>
            <AttendeeDetails setFormInitialValues={setFormInitialValues} initialValues={formInitialValues} allGuests={allGuests} memberInfo={userInfo} mode={mode} errors={errors} />
          </div>
          <div>
            <Gatherings initialValues={formInitialValues} errors={errors} setErrors={setErrors} selectedLocation={selectedLocation} gatherings={gatherings} userInfo={userInfo} guests={allGuests} />
          </div>
          <div>
            <ArrivalAndDepatureDate initialValues={formInitialValues} allGatherings={gatherings} errors={errors} />
          </div>
          <div>
            <Topics defaultTags={defaultTags} selectedItems={formInitialValues?.topics ?? []} />
          </div>
          <div>
            <TopicsDescription initialValue={formInitialValues?.reason} />
          </div>

          <div id="telegram-section">
            <TelegramHandle initialValues={formInitialValues} scrollTo={scrollTo} />
          </div>
          <div id='officehours-section'>
            <OfficeHours initialValues={formInitialValues} scrollTo={scrollTo} />
          </div>
        </div>

        <div className="atndform__optns">
          <button type="button" className="atndform__optns__cls">
            Close
          </button>

          <button type="submit" className="atndform__optns__sbmt">
            {mode === IAM_GOING_POPUP_MODES.EDIT ? 'Save' : 'Submit'}
          </button>
        </div>
      </form>

      <style jsx>
        {`
          .attndformcnt {
            position: fixed;
            z-index: 5;
            top: 0;
            bottom: 0;
            right: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(0, 0, 0, 0.5);
          }

          .atndform {
            padding: 20px 0 0 0;
            width: 90vw;
            height: 90vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: white;
            border-radius: 12px;
            position: relative;
          }

          .atndform__bdy {
            flex: 1;
            padding: 0 20px 20px 20px;
            overflow: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .atndform__bdy__ttl {
            font-size: 17px;
            font-weight: 600;
          }

          .atndform__optns {
            height: 80px;
            display: flex;
            justify-content: end;
            align-items: center;
            margin: 0 40px 20px 0;
            gap: 8px;
          }

          .modal__cn__closebtn {
            position: absolute;
            border: none;
            top: 12px;
            right: 12px;
            background: transparent;
            user-select: none;
            outline: none;
          }

          .atndform__optns__cls,
          .atndform__optns__sbmt {
            height: 40px;
            border-radius: 8px;
            padding: 10px 24px;
            font-size: 14px;
            line-height: 20px;
            font-weight: 500;
            border: 1px solid #cbd5e1;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            background-color: inherit;
          }

          .atndform__optns__sbmt {
            background: #156ff7;
            color: white;
          }

          @media (min-width: 1024px) {
            .atndform {
              width: 680px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default AttendeeForm;
