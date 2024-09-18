'use client';
import Modal from '@/components/core/modal';
import RegisterFormLoader from '@/components/core/register/register-form-loader';
import { createEventGuest } from '@/services/irl.service';
import { IUserInfo } from '@/types/shared.types';
import { FormEvent, useEffect, useRef, useState } from 'react';
import ArrivalAndDepatureDate from './arrival-depature-date';
import AttendeeDetails from './attendee-details';
import Gatherings from './gatherings';
import OfficeHours from './office-hours';
import TelegramHandle from './telegram-handle';
import Topics from './topics';
import TopicsDescription from './topics-description';
import { ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS, EVENTS, IAM_GOING_POPUP_MODES, TOAST_MESSAGES } from '@/utils/constants';
import { toast } from 'react-toastify';
import { canUserPerformEditAction } from '@/utils/irl.utils';

interface IAttendeeForm {
  formdata: any;
  selectedLocation: any;
  userInfo: IUserInfo;
  allGatherings: any[];
  defaultTags: any[];
  mode: string;
  allGuests: any[];
  onClose: any;
}

const AttendeeForm = (props: IAttendeeForm) => {
  const ref = useRef<HTMLDialogElement>(null);

  const mode = props?.mode;
  const selectedLocation = props?.selectedLocation;
  const gatherings = props?.allGatherings;
  const userInfo = mode === IAM_GOING_POPUP_MODES.ADMINADD ? null : props?.userInfo;
  const defaultTags = props?.defaultTags;
  const allGuests = props?.allGuests;
  const onClose = props?.onClose;

  const isAllowedToManageGuests = canUserPerformEditAction(userInfo?.roles ?? [], ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS);

  const [errors, setErrors] = useState<any>({
    gatheringsError: [],
    participationError: [],
    dateErrors: [],
  });

  const attendeeFormRef = useRef<HTMLFormElement>(null);
  const formBodyRef = useRef<HTMLDivElement>(null);

  // const formInitialData = props?.formdata ?? {
  //   teamUid: '',
  //   telegramId: '',
  //   reason: '',
  //   topics: [],
  //   officeHours: '',
  //   additionalInfo: {
  //     checkInDate: '',
  //     checkOutDate: '',
  //   },
  // };

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
      setErrors((prev: any) => ({ ...prev, gatheringsError: ['At least one gathering should be selected'] }));
    }

    if (formattedData.additionalInfo.checkInDate && !formattedData.additionalInfo.checkOutDate) {
      isError = true;
      setErrors((prev: any) => ({ ...prev, dateErrors: { checkOut: 'Check out date is required' } }));
    } else if (formattedData.additionalInfo.checkOutDate && !formattedData.additionalInfo.checkInDate) {
      isError = true;
      setErrors((prev: any) => ({ ...prev, dateErrors: { checkIn: 'Check in date is required' } }));
    } else if (formattedData.additionalInfo.checkInDate && formattedData.additionalInfo.checkOutDate) {
      const checkInDate = new Date(formattedData.additionalInfo.checkInDate);
      const checkOutDate = new Date(formattedData.additionalInfo.checkOutDate);
      if (checkInDate > checkOutDate) {
        isError = true;
        setErrors((prev: any) => ({ ...prev, dateErrors: { comparisonError: 'Departure date should be greater than or equal to the Arrival date' } }));
      }
    } else if (allGuests?.includes(formattedData?.membeUid)) {
      isError = true;
    } else {
      setErrors({ gatheringsError: [], participationError: [], dateErrors: [] });
    }

    if (isError) {
      formScroll();
      return;
    }

    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    const result = await createEventGuest(selectedLocation.uid, formattedData);
    if (result.error) {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      onClose();
      return;
    }
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
    onClose();
    if (isAllowedToManageGuests) {
      toast.success(TOAST_MESSAGES.ATTENDEE_ADDED_SUCCESSFULLY);
    } else {
      toast.success(TOAST_MESSAGES.DETAILS_ADDED_SUCCESSFULLY);
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
          const hostSubEventIndex = events[eventIndex].hostSubEvents.findIndex((subEvent: any) => subEvent.id === subEventId);
          if (hostSubEventIndex !== -1) {
            events[eventIndex].hostSubEvents[hostSubEventIndex][subEventKey] = formValues[key].trim();
          } else {
            events[eventIndex].hostSubEvents.push({
              id: subEventId,
              [subEventKey]: formValues[key].trim(),
            });
          }
        }
      } else if (key.startsWith('speakerSubEvent')) {
        const [_, eventUid, subEventId, subEventKey] = key.split('-');
        events = structuredClone([...events]).filter((g) => g);
        const eventIndex = [...events].findIndex((event) => event.uid === eventUid);
        if (eventIndex !== -1) {
          const speakerSubEventIndex = events[eventIndex].speakerSubEvents.findIndex((subEvent: any) => subEvent.id === subEventId);
          if (speakerSubEventIndex !== -1) {
            events[eventIndex].speakerSubEvents[speakerSubEventIndex][subEventKey] = formValues[key].trim();
          } else {
            events[eventIndex].speakerSubEvents.push({
              id: subEventId,
              [subEventKey]: formValues[key].trim(),
            });
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

  return (
    <div>
      <Modal onClose={onClose} modalRef={ref}>
        <RegisterFormLoader />
        <form noValidate onSubmit={onFormSubmitHandler} ref={attendeeFormRef} className="atndform">
          <div className="atndform__bdy" ref={formBodyRef}>
            <h2 className="atndform__bdy__ttl">Enter Attendee Details</h2>
            <div>
              <AttendeeDetails allGuests={allGuests} memberInfo={userInfo} mode={mode} />
            </div>
            <div>
              <Gatherings errors={errors} selectedLocation={selectedLocation} gatherings={gatherings} userInfo={userInfo} />
            </div>
            <div>
              <ArrivalAndDepatureDate allGatherings={gatherings} errors={errors} />
            </div>
            <div>
              <Topics defaultTags={defaultTags} selectedItems={[]} />
            </div>
            <div>
              <TopicsDescription />
            </div>

            <div>
              <TelegramHandle />
            </div>
            <div>
              <OfficeHours />
            </div>
          </div>

          <div className="atndform__optns">
            <button type="button" className="atndform__optns__cls">
              Close
            </button>

            <button type="submit" className="atndform__optns__sbmt">
              Submit
            </button>
          </div>
        </form>
      </Modal>

      <style jsx>
        {`
          .atndform {
            padding: 20px 0 0 0;
            width: 90vw;
            height: 90vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
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
