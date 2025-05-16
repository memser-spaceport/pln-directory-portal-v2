import React, { FormEvent, use, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { IIrlAttendeeFormErrors, IIrlEvent, IIrlGathering, IIrlGuest, IIrlLocation, IIrlParticipationEvent } from '@/types/irl.types';
import { IUserInfo } from '@/types/shared.types';
import { ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS, EVENTS, EVENTS_SUBMIT_FORM_TYPES, IAM_GOING_POPUP_MODES, IRL_ATTENDEE_FORM_ERRORS, TOAST_MESSAGES } from '@/utils/constants';
import { canUserPerformEditAction, mergeGuestEvents } from '@/utils/irl.utils';
import { isLink } from '@/utils/third-party.helper';
import AttendeeDetails from './attendee-details';
import AttendeeFormErrors from './attendee-form-errors';
import ArrivalAndDepatureDate from './arrival-depature-date';
import Gatherings from './gatherings';
import OfficeHours from './office-hours';
import TelegramHandle from './telegram-handle';
import Topics from './topics';
import TopicsDescription from './topics-description';
import { createEventGuest, editEventGuest, markMyPresence } from '@/services/irl.service';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getAnalyticsLocationInfo, getAnalyticsUserInfo, getTelegramUsername, removeAtSymbol, triggerLoader } from '@/utils/common.utils';
import { useSearchParams } from 'next/navigation';
import AttendeeOptions from './attendee-options';

interface IAttendeeForm {
  selectedLocation: IIrlLocation;
  userInfo: IUserInfo | null;
  allGatherings: IIrlEvent[];
  defaultTags: string[];
  mode: string;
  allGuests: any;
  onClose: () => void;
  scrollTo: string;
  formData: any;
  getEventDetails: any;
  searchParams: any;
  from?: string;
}

const AttendeeForm: React.FC<IAttendeeForm> = (props) => {
  const ref = useRef<HTMLDialogElement>(null);

  const mode = props?.mode;
  const selectedLocation = props?.selectedLocation;
  const loggedInUser = props?.userInfo;
  const userInfo = mode === IAM_GOING_POPUP_MODES.ADMINADD ? null : { name: props?.formData?.member?.name, uid: props?.formData?.member?.uid, roles: props?.formData?.member?.roles };
  const defaultTags = props?.defaultTags;
  const allGuests = props?.allGuests;
  const onClose = props?.onClose;
  const scrollTo = props?.scrollTo;
  const searchParams = props?.searchParams;
  const getEventDetails = props?.getEventDetails;
  const gatherings = getGatherings();

  const eventType = searchParams?.type === 'past' ? 'past' : 'upcoming';
  const analytics = useIrlAnalytics();
  const from = props?.from ?? '';

  const [formInitialValues, setFormInitialValues] = useState<any>(props?.formData);
  const [topicsAndReason, setTopicsAndReason] = useState(props?.formData?.topicsAndReason ?? null);
  const isAllowedToManageGuests = canUserPerformEditAction(userInfo?.roles ?? [], ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS);
  const [isVerifiedMember, setIsVerifiedMember] = useState();
  const [guestGoingEvents, setGuestGoingEvents] = useState([]);

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

  useEffect(() => {
    if (typeof formInitialValues?.topicsAndReason === 'object' && formInitialValues?.topicsAndReason !== null) {
      setTopicsAndReason(formInitialValues.topicsAndReason);
    }
  }, [formInitialValues]);

  function getGatherings(): IIrlEvent[] {
    // if (searchParams?.type === 'past') {
    //   if (searchParams?.event) {
    //     const filteredList = props?.allGatherings.filter((gathering: IIrlEvent) => gathering?.slugURL === searchParams?.event);
    //     if (filteredList?.length > 0) {
    //       return filteredList;
    //     }
    //   }
    //   return [];
    // }
    return props?.allGatherings ?? [];
  }

  const onFormSubmitHandler = async (e: FormEvent, type: string) => {
    e.preventDefault();
    try {
      if (type === 'Save') {
        analytics.irlGuestDetailEditBtnClick(getAnalyticsUserInfo(props?.userInfo), getAnalyticsLocationInfo(selectedLocation), 'clicked');
      }
      analytics.irlGuestDetailSaveBtnClick(getAnalyticsUserInfo(props?.userInfo), getAnalyticsLocationInfo(selectedLocation), 'clicked');

      if (!attendeeFormRef.current) {
        return;
      }

      const isUpdate = allGuests?.some((guest: any) => guest.memberUid === formInitialValues?.memberUid);
      const formData = new FormData(attendeeFormRef.current);
      const formattedData = transformObject(Object.fromEntries(formData));

      // if(eventType === 'past' && (mode === IAM_GOING_POPUP_MODES.EDIT || isUpdate)) {
      //   const finalResult = mergeGuestEvents([...guestGoingEvents], [...formattedData.events]);
      //   formattedData.events = finalResult;
      // }

      formattedData?.events?.map((event: any) => {
        // Process hostSubEvents, speakerSubEvents and sponsorSubEvents
        event.hostSubEvents = processSubEvents(event?.hostSubEvents);
        event.speakerSubEvents = processSubEvents(event?.speakerSubEvents);
        event.sponsorSubEvents = processSubEvents(event?.sponsorSubEvents);
      });

      const isError = validateForm(formattedData);
      if (isError) {
        formScroll();
        return;
      }

      triggerLoader(true);

      if ((mode === IAM_GOING_POPUP_MODES.ADMINADD || mode === IAM_GOING_POPUP_MODES.ADD) && !isUpdate) {
        analytics.irlGuestDetailSaveBtnClick(getAnalyticsUserInfo(userInfo), getAnalyticsLocationInfo(selectedLocation), 'api_initiated', formattedData);
        let result;
        if (from === EVENTS_SUBMIT_FORM_TYPES.MARK_PRESENCE) {
          formattedData['memberName'] = userInfo?.name;
          result = await markMyPresence(selectedLocation.uid, formattedData, eventType);
        } else {
          result = await createEventGuest(selectedLocation.uid, formattedData, eventType);
        }
        if (result?.error) {
          onClose();
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
          triggerLoader(false);
          return;
        }
        onClose();
        await getEventDetails();
        triggerLoader(false);
        if (from === EVENTS_SUBMIT_FORM_TYPES.MARK_PRESENCE) {
          document.dispatchEvent(new Event(EVENTS.MARK_MY_PRESENCE_SUBMIT_SUCCESS_POPUP));
        } else {
          analytics.irlGuestDetailSaveBtnClick(getAnalyticsUserInfo(userInfo), getAnalyticsLocationInfo(selectedLocation), 'api_success', formattedData);
          if (isAllowedToManageGuests) {
            toast.success(TOAST_MESSAGES.ATTENDEE_ADDED_SUCCESSFULLY);
          } else {
            toast.success(TOAST_MESSAGES.DETAILS_ADDED_SUCCESSFULLY);
          }
        }
      } else if (mode === IAM_GOING_POPUP_MODES.EDIT || isUpdate) {
        analytics.irlGuestDetailEditBtnClick(getAnalyticsUserInfo(userInfo), getAnalyticsLocationInfo(selectedLocation), 'api_initiated', formattedData);
        const eventType = searchParams?.type === 'past' ? 'past' : 'upcoming';
        const result = await editEventGuest(selectedLocation.uid, formInitialValues?.memberUid, formattedData, eventType);
        if (result?.error) {
          triggerLoader(false);
          onClose();
          toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
          return;
        }
        analytics.irlGuestDetailEditBtnClick(getAnalyticsUserInfo(userInfo), getAnalyticsLocationInfo(selectedLocation), 'api_success', formattedData);
        await getEventDetails();
        onClose();
        if (isAllowedToManageGuests) {
          toast.success(TOAST_MESSAGES.ATTENDEE_UPDATED_SUCCESSFULLY);
        } else {
          toast.success(TOAST_MESSAGES.DETAILS_UPDATED_SUCCESSFULLY);
        }
      }
    } catch (error) {
      triggerLoader(false);
      console.error(error);
      analytics.irlGuestDetailSaveError(getAnalyticsUserInfo(props?.userInfo), getAnalyticsLocationInfo(selectedLocation), type);
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
            events[eventIndex]['isSponsor'] = false;
            events[eventIndex]['hostSubEvents'] = [];
            events[eventIndex]['speakerSubEvents'] = [];
            events[eventIndex]['sponsorSubEvents'] = [];
            if (from === EVENTS_SUBMIT_FORM_TYPES.MARK_PRESENCE) {
              events[eventIndex]['eventName'] = props?.allGatherings?.find((gathering: IIrlEvent) => gathering?.uid === formValues[key])?.name;
            }
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
      } else if (key.startsWith('isSponsor')) {
        const eventUid = key.split('-')[1];
        events = structuredClone([...events]).filter((g) => g);
        const eventIndex = [...events].findIndex((event) => event.uid === eventUid);
        if (eventIndex !== -1) {
          events[eventIndex].isSponsor = formValues[key] === 'true';
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
      } else if (key.startsWith('sponsorSubEvent')) {
        const [_, eventUid, subEventId, subEventKey] = key.split('-');
        events = structuredClone([...events]).filter((g) => g);
        const eventIndex = [...events].findIndex((event) => event.uid === eventUid);
        if (eventIndex !== -1) {
          const sponsorSubEventIndex = events[eventIndex].sponsorSubEvents.findIndex((subEvent: any) => subEvent.uid === subEventId);
          if (sponsorSubEventIndex !== -1) {
            events[eventIndex].sponsorSubEvents[sponsorSubEventIndex][subEventKey] = formValues[key].trim();
          } else {
            const newSponsorSiubEvent = {
              uid: subEventId,
              [subEventKey]: formValues[key].trim(),
            };
            events[eventIndex].sponsorSubEvents.push(newSponsorSiubEvent);
          }
        }
      } else if (key.startsWith('checkInDate') || key.startsWith('checkOutDate')) {
        additionalInfo[key] = formValues[key];
      } else if (key.startsWith('topics')) {
        topics = [...topics, formValues[key]];
      } else if (key === 'telegramId') {
        const formattedValue = removeAtSymbol(formValues[key].trim());
        result[key] = getTelegramUsername(formattedValue);
      } else {
        result[key] = formValues[key];
      }
    }

    result = { ...result, events: [...events].filter((g) => g), additionalInfo, topics, locationName: selectedLocation?.name };

    return result;
  }

  function processSubEvents(subEvents: any[]) {
    if (!subEvents) return [];
    return subEvents.filter((subEvent: any) => subEvent?.name?.trim() !== '' || subEvent?.link?.trim() !== '');
  }

  useEffect(() => {
    if (scrollTo && formBodyRef.current) {
      const section = formBodyRef.current.querySelector(`#${scrollTo}`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setFormInitialValues(props?.formData);
  }, []);

  const onCloseClickHandler = () => {
    analytics.irlAddAttendeePopupCloseClicked(getAnalyticsUserInfo(props?.userInfo), getAnalyticsLocationInfo(selectedLocation));
    onClose();
  };

  const validateForm = (formattedData: any) => {
    let isError = false;
    if (!formattedData?.memberUid) {
      isError = true;
      setErrors((prev: IIrlAttendeeFormErrors) => ({ ...prev, gatheringErrors: Array.from(new Set([...prev?.gatheringErrors, IRL_ATTENDEE_FORM_ERRORS.SELECT_MEMBER])) }));
    } else {
      setErrors((prev: IIrlAttendeeFormErrors) => ({ ...prev, gatheringErrors: prev.gatheringErrors.filter((error: string) => error !== IRL_ATTENDEE_FORM_ERRORS.SELECT_MEMBER) }));
    }

    const canSkipGateringsValidation =
      formInitialValues && formInitialValues?.events?.length != 0 && eventType === 'past' && from != EVENTS_SUBMIT_FORM_TYPES.MARK_PRESENCE && mode !== IAM_GOING_POPUP_MODES.ADMINADD;
    if (formattedData.events.length === 0 && !canSkipGateringsValidation) {
      isError = true;
      setErrors((prev: IIrlAttendeeFormErrors) => ({ ...prev, participationError: [], gatheringErrors: Array.from(new Set([...prev?.gatheringErrors, IRL_ATTENDEE_FORM_ERRORS.SELECT_GATHERING])) }));
    } else {
      let participationErrors: string[] = [];
      formattedData?.events?.map((event: any) => {
        event?.hostSubEvents?.map((hostSubEvent: IIrlParticipationEvent) => {
          if (hostSubEvent?.link && !isLink(hostSubEvent?.link)) {
            isError = true;
            participationErrors.push(`${hostSubEvent?.uid}-link`);
          }
        });

        event?.speakerSubEvents?.map((speakerSubEvent: IIrlParticipationEvent) => {
          if (speakerSubEvent?.link && !isLink(speakerSubEvent?.link.trim())) {
            isError = true;
            participationErrors.push(`${speakerSubEvent?.uid}-link`);
          }
        });

        event?.sponsorSubEvents?.map((sponsorSubEvent: IIrlParticipationEvent) => {
          if (sponsorSubEvent?.link && !isLink(sponsorSubEvent?.link.trim())) {
            isError = true;
            participationErrors.push(`${sponsorSubEvent?.uid}-link`);
          }
        });
      });
      setErrors((prev: IIrlAttendeeFormErrors) => ({
        ...prev,
        gatheringErrors: prev.gatheringErrors.filter((error: string) => error !== IRL_ATTENDEE_FORM_ERRORS.SELECT_GATHERING),
        participationErrors: Array.from(new Set([...participationErrors])),
      }));
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
    return isError;
  };

  return (
    <div className="attndformcnt">
      {/* <RegisterFormLoader /> */}
      <form noValidate onSubmit={(e) => onFormSubmitHandler(e, IAM_GOING_POPUP_MODES.EDIT ? 'Edit' : 'Save')} ref={attendeeFormRef} className="atndform">
        {/* <button type="button" className="modal__cn__closebtn" onClick={onCloseClickHandler}>
          <Image height={20} width={20} alt="close" loading="lazy" src="/icons/close.svg" />
        </button> */}
        <div className="atndform__bdy" ref={formBodyRef}>
          <h2 className="atndform__bdy__ttl">{from === EVENTS_SUBMIT_FORM_TYPES.MARK_PRESENCE ? 'Request to claim your attendance' : 'Enter Attendee Details'}</h2>
          <AttendeeFormErrors errors={errors} />
          <div>
            <AttendeeDetails
              setGuestGoingEvents={setGuestGoingEvents}
              setIsVerifiedMember={setIsVerifiedMember}
              gatherings={gatherings}
              setFormInitialValues={setFormInitialValues}
              initialValues={formInitialValues}
              allGuests={allGuests}
              memberInfo={userInfo}
              mode={mode}
              errors={errors}
              location={selectedLocation}
              eventType={eventType}
            />
          </div>
          <div>
            <Gatherings
              loggedInUserInfo={loggedInUser}
              initialValues={formInitialValues}
              errors={errors}
              setErrors={setErrors}
              selectedLocation={selectedLocation}
              gatherings={gatherings}
              userInfo={userInfo}
              guests={allGuests}
              isVerifiedMember={isVerifiedMember}
              eventType={eventType}
              from={from}
            />
          </div>
          {from !== EVENTS_SUBMIT_FORM_TYPES.MARK_PRESENCE && (
            <div className="atndform__details">
              <div>
                <ArrivalAndDepatureDate initialValues={formInitialValues} allGatherings={gatherings} errors={errors} />
              </div>
              <div>
                <Topics defaultTags={defaultTags} selectedItems={formInitialValues?.topicsAndReason ? (formInitialValues?.topicsAndReason?.topics ?? []) : []} />
              </div>
              <div>
                <TopicsDescription initialValue={formInitialValues?.topicsAndReason ? formInitialValues?.topicsAndReason?.reason : ''} />
              </div>
              <div className="interest-note">
                <div className="interest-note__icon">
                  <Image src="/icons/info-blue.svg" alt="info" width={16} height={16} />
                </div>
                <p className="interest-note__text">
                  Modifications to these fields (Select topics of interest and Describe your interests) will affect all events at this location, including past events
                </p>
              </div>

              <div id="telegram-section">
                <TelegramHandle location={selectedLocation} userInfo={props?.userInfo} initialValues={formInitialValues} scrollTo={scrollTo} />
              </div>
              <div id="officehours-section">
                <OfficeHours location={selectedLocation} userInfo={props?.userInfo} initialValues={formInitialValues} scrollTo={scrollTo} />
              </div>
            </div>
          )}
        </div>

        <div className="atndform__optns">
          <AttendeeOptions mode={mode} onCloseClickHandler={onCloseClickHandler} />
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
            height: auto;
            max-height: 90vh;
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

          .interest-note {
            font-weight: 400;
            font-size: 14px;
            line-height: 24px;
            background-color: #dbeafe;
            padding: 12px;
            border-radius: 8px;
            display: flex;
            gap: 8px;
          }

          .interest-note__icon {
            padding-top: 2px;
          }

          .atndform__bdy__ttl {
            font-size: 17px;
            font-weight: 600;
          }

          .atndform__details {
            display: flex;
            flex-direction: column;
            gap: 12px;
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
