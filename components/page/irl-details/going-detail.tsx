'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { useParams } from 'next/navigation';
import TagsPicker from './tags-picker';
import { getMemberInfo } from '@/services/members.service';
import { getEventDetailBySlug, createEventGuest, editEventGuest } from '@/services/irl.service';
import { formatDateRangeForDescription, formatDateToISO, getArrivalDepartureDateRange, getTelegramUsername, removeAt } from '@/utils/irl.utils';
import TextArea from '@/components/form/text-area';
import { EVENTS, OH_GUIDELINE_URL, TOAST_MESSAGES } from '@/utils/constants';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import useTagsPicker from '@/hooks/irl/use-tags-picker';
import { getAnalyticsUserInfo, getParsedValue } from '@/utils/common.utils';
import SingleSelect from '@/components/form/single-select';
import RegsiterFormLoader from '@/components/core/register/register-form-loader';
import SingleSelectWithImage from '@/components/form/single-select-with-image';

interface GoingProps {
  isUserGoing: boolean;
  registeredGuest: any;
  eventDetails: any;
  teams: any;
  showTelegram: boolean;
  onClose: () => void;
  focusOHField: boolean;
}

const GoingDetail: React.FC<GoingProps> = ({ isUserGoing, registeredGuest, eventDetails, teams, showTelegram, onClose, focusOHField }) => {
  //variables
  const [formErrors, setFormErrors] = useState<any>({});
  const [connectDetail, setConnectDetail] = useState<any>({});
  const [formValues, setFormValues] = useState({
    teamUid: '',
    telegramId: '',
    reason: '',
    topics: [],
    officeHours: '',
    additionalInfo: {
      checkInDate: '',
      checkOutDate: '',
    },
  });
  const analytics = useIrlAnalytics();
  const officeHoursRef = useRef<HTMLInputElement>(null);
  const { id } = useParams();
  const userInfo = getParsedValue(Cookies.get('userInfo') || '');
  const slug = id as string;
  const departureMinDate = formatDateToISO(eventDetails?.startDate);
  const arrivalMaxDate = formatDateToISO(eventDetails?.endDate);
  const startAndEndDateInfo = formatDateRangeForDescription(eventDetails?.startDate, eventDetails?.endDate);
  const defaultTags = eventDetails?.topics ?? [];
  const topicsProps = useTagsPicker({
    defaultTags,
    selectedItems: formValues?.topics,
  });
  const intialTeamValue = teams?.find((team: any) => team?.id === formValues?.teamUid);
  const dateRange = getArrivalDepartureDateRange(eventDetails?.startDate, eventDetails?.endDate, 5, 4);

  //methods
  const getEventDetails = async () => {
    const authToken = getParsedValue(Cookies.get('authToken') || '');
    const eventDetails = await getEventDetailBySlug(slug, authToken);
    document.dispatchEvent(
      new CustomEvent('updateGuests', {
        detail: {
          eventDetails,
        },
      })
    );
  };

  const handleChange = (event: any) => {
    const { name, value } = event.target;
    setFormValues((prevFormData) => ({ ...prevFormData, [name]: value }));
  };

  const onAdditionalInfoChange = (event: any) => {
    const { name, value } = event.target;
    setFormValues((prevFormData) => ({
      ...prevFormData,
      additionalInfo: { ...prevFormData?.additionalInfo, [name]: value },
    }));
  };

  const handleTeamChange = (option: any) => {
    setFormValues((prevFormData) => ({ ...prevFormData, teamUid: option?.id }));
  };

  const onClearDate = (key: string) => {
    setFormValues((prev) => ({
      ...prev,
      additionalInfo: {
        ...prev?.additionalInfo,
        [key]: '',
      },
    }));
  };

  const handleDisplayWarning = (elementId: string) => {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
      messageElement.classList.remove('hidden-message');
      messageElement.classList.add('visible-message');
    }
  };

  const handleHideWarning = (elementId: string) => {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
      messageElement.classList.remove('visible-message');
      messageElement.classList.add('hidden-message');
    }
  };

  const handleTelegramFocus = () => {
    //update the telegram value when user focus on the field when blank value is saved already
    if (connectDetail?.telegramId !== '' && registeredGuest?.isTelegramRemoved && formValues?.telegramId === '') {
      setFormValues((prevFormData) => ({
        ...prevFormData,
        telegramId: removeAt(getTelegramUsername(connectDetail?.telegramId)),
      }));
    }
    handleDisplayWarning('telegram-message');
  };

  const handleOfficeHoursFocus = () => {
    //update the office hours value when user focus on the field when blank value is saved already
    if (connectDetail?.officeHours !== '' && registeredGuest?.officeHours === '' && formValues?.officeHours === '') {
      setFormValues((prevFormData) => ({ ...prevFormData, officeHours: connectDetail?.officeHours }));
    }
    handleDisplayWarning('oh-message');
  };

  const handleOHGuidlineClick = () => {
    analytics.irlGuestDetailOHGuidelineClick(getAnalyticsUserInfo(userInfo), { eventId: eventDetails?.id, eventName: eventDetails?.name });
  };

  const handlePrivacySettingClick = () => {
    analytics.irlGuestDetailPrivacySettingClick(getAnalyticsUserInfo(userInfo), { eventId: eventDetails?.id, eventName: eventDetails?.name });
  };

  //edit guest details
  const onEditGuestDetails = async () => {
    const authToken = getParsedValue(Cookies.get('authToken') || '');
    analytics.irlGuestDetailEditBtnClick(getAnalyticsUserInfo(userInfo), { eventId: eventDetails?.id, eventName: eventDetails?.name }, 'clicked');

    const payload = {
      ...formValues,
      topics: topicsProps?.selectedItems,
      telegramId: removeAt(formValues?.telegramId),
      memberUid: userInfo?.uid,
      eventUid: eventDetails?.id,
      uid: registeredGuest.uid,
    };

    const team = teams?.find((team: any) => team.id === payload?.teamUid);
    const teamName = team?.name;
    const isValid = validateForm(payload);

    if (isValid) {
      analytics.irlGuestDetailEditBtnClick(getAnalyticsUserInfo(userInfo), { eventId: eventDetails?.id, eventName: eventDetails?.name, teamName }, 'api_initiated', payload);
      const response = await editEventGuest(eventDetails?.slugUrl, registeredGuest.uid, payload, authToken);

      if (response) {
        analytics.irlGuestDetailEditBtnClick(getAnalyticsUserInfo(userInfo), { eventId: eventDetails?.id, eventName: eventDetails?.name, teamName }, 'api_success', payload);
        await getEventDetails();
        onClose();
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        toast.success('Your details has been updated successfully');
      }
    } else {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
    }
  };

  //validate form
  const validateForm = (formValues: any) => {
    const errors = {} as any;
    const initialTeamValue = teams?.find((team: any) => team?.id === formValues?.teamUid);
    const urlRE = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?)(?![.\S])/gi;
    if (!formValues?.teamUid?.trim() || !initialTeamValue) {
      errors.teamUid = 'Team is required';
    }

    if (formValues.additionalInfo.checkInDate && !formValues.additionalInfo.checkOutDate) {
      errors.checkOutDate = 'Departure date is required';
    }

    if (!formValues.additionalInfo.checkInDate && formValues.additionalInfo.checkOutDate) {
      errors.checkInDate = 'Arrival date is required';
    }

    if (formValues.officeHours !== '' && !formValues.officeHours.match(urlRE)) {
      errors.officeHours = 'Enter valid link';
    }

    const checkInDate = new Date(formValues.additionalInfo.checkInDate).getTime();
    const checkOutDate = new Date(formValues.additionalInfo.checkOutDate).getTime();

    if (checkOutDate < checkInDate) {
      errors.maxDate = 'Departure date should be greater than or equal to the Arrival date';
    }

    setFormErrors(errors);
    return Object.keys(errors)?.length === 0;
  };

  //add event details
  const onAddGuestDetails = async () => {
    analytics.irlGuestDetailSaveBtnClick(getAnalyticsUserInfo(userInfo), { eventId: eventDetails?.id, eventName: eventDetails?.name }, 'clicked');

    const authToken = getParsedValue(Cookies.get('authToken') || '');

    const payload = {
      ...formValues,
      topics: topicsProps?.selectedItems,
      telegramId: removeAt(formValues?.telegramId),
      memberUid: userInfo?.uid,
      eventUid: eventDetails?.id,
    };

    const team = teams?.find((team: any) => team.id === payload?.teamUid);
    const teamName = team?.name;

    const isValid = validateForm(payload);

    if (isValid) {
      analytics.irlGuestDetailSaveBtnClick(getAnalyticsUserInfo(userInfo), { eventId: eventDetails?.id, eventName: eventDetails?.name, teamName }, 'api_initiated', payload);

      const response = await createEventGuest(eventDetails?.slugUrl, payload, authToken);
      if (response) {
        analytics.irlGuestDetailSaveBtnClick(getAnalyticsUserInfo(userInfo), { eventId: eventDetails?.id, eventName: eventDetails?.name, teamName }, 'api_success', payload);
        await getEventDetails();
        onClose();
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        toast.success('Your details has been added successfully');
      }
    } else {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
    }
  };

  //form submit
  const onSubmit = async (event: any) => {
    event.preventDefault();
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    try {
      if (!isUserGoing) {
        await onAddGuestDetails();
      } else {
        await onEditGuestDetails();
      }
    } catch {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      analytics.irlGuestDetailSaveError(getAnalyticsUserInfo(userInfo), { eventId: eventDetails?.id, eventName: eventDetails?.name }, !isUserGoing ? 'Save' : 'Edit');
      onClose();
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
    }
  };

  useEffect(() => {
    if (isUserGoing) {
      const data = {
        teamUid: registeredGuest?.teamUid,
        telegramId: '',
        reason: registeredGuest.reason ? registeredGuest?.reason?.trim() : '',
        topics: registeredGuest?.topics,
        officeHours: registeredGuest?.officeHours ? registeredGuest?.officeHours : '',
        additionalInfo: {
          ...formValues.additionalInfo,
          checkInDate: registeredGuest?.additionalInfo?.checkInDate,
          checkOutDate: registeredGuest?.additionalInfo?.checkOutDate,
        },
      };
      setFormValues(data);
    } else {
      const teamUid = teams?.find((team: any) => team?.mainTeam)?.id;
      setFormValues((prev) => ({ ...prev, teamUid }));
    }
  }, []);

  useEffect(() => {
    const getMemberConnectDetails = async () => {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
      try {
        const response = await getMemberInfo(userInfo?.uid);
        const telegram = response?.data?.telegramHandler ? removeAt(getTelegramUsername(response?.data?.telegramHandler)) : '';
        setConnectDetail({ telegramId: telegram, officeHours: response?.data?.officeHours ?? '' });
        setFormValues((prevFormData) => ({
          ...prevFormData,
          telegramId: !registeredGuest?.isTelegramRemoved ? telegram : '',
          officeHours: registeredGuest?.officeHours === '' ? '' : response?.data?.officeHours ?? '',
        }));
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      } catch (error) {
        console.error(error);
      }
    };
    getMemberConnectDetails();
  }, []);

  useEffect(() => {
    if (focusOHField && officeHoursRef.current) {
      officeHoursRef.current.focus();
      officeHoursRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="details">
          <h2 className="details__title">Attendee Details</h2>
          <div className="details__cn">
            <div className="details__cn__team">
              <label className="label details__cn__team__label">Team</label>
              <SingleSelectWithImage
                id="going-team-info"
                isMandatory={true}
                placeholder="Select a team"
                displayKey="name"
                options={teams}
                selectedOption={intialTeamValue || {}}
                uniqueKey="id"
                iconKey="logo"
                defaultIcon="/icons/team-default-profile.svg"
                onItemSelect={handleTeamChange}
                arrowImgUrl="/icons/arrow-down.svg"
              />
              {formErrors?.teamUid && <span className="error">{formErrors?.teamUid}</span>}
            </div>
            <div className="details__cn__telegram">
              <label className="label details__cn__telegram__label" htmlFor="going-telegram">
                Telegram Handle
              </label>
              <input
                name="telegramId"
                id="going-telegram"
                placeholder={registeredGuest?.isTelegramRemoved && connectDetail.telegramId !== '' ? connectDetail.telegramId : 'Enter handle here'}
                className="details__cn__telegram__field"
                value={formValues?.telegramId}
                onChange={handleChange}
                // onKeyDown={handleKeyDown}
                onFocus={handleTelegramFocus}
                onBlur={() => handleHideWarning('telegram-message')}
              />
              <span className="details__cn__telegram__handle">@</span>
              {!showTelegram && (
                <div className="details__cn__telegram__info">
                  <img src="/icons/info.svg" alt="info" width={16} height={16} />
                  <p className="details__cn__telegram__info__text">
                    Your Telegram handle is hidden. Unhide it in your profile&apos;s{' '}
                    <Link href="/settings/privacy" legacyBehavior>
                      <a target="_blank" className="details__cn__telegram__info__text__link" onClick={handlePrivacySettingClick}>
                        privacy settings
                      </a>
                    </Link>{' '}
                    to show it here and refresh this page once you have updated your privacy settings.
                  </p>
                </div>
              )}
              <div className="details__cn__telegram__warning hidden-message" id="telegram-message">
                <img src="/icons/info-yellow.svg" alt="info" width={16} height={16} />
                <p className="details__cn__telegram__warning__msg">Any changes made here will also update your directory profile&apos;s Telegram handle, except for deletions.</p>
              </div>
            </div>
            <div className="details__cn__topics">
              <label className="label details__cn__topics__label">Select topics of interest</label>
              <TagsPicker
                inputValue={topicsProps?.inputValue}
                selectedItems={topicsProps?.selectedItems}
                onItemsSelected={topicsProps?.onItemSelected}
                onInputChange={topicsProps?.onInputChange}
                onInputKeyDown={topicsProps?.onInputKeyDown}
                error={topicsProps?.error}
                filteredOptions={topicsProps?.filteredOptions}
                addCurrentInputValue={topicsProps?.addCurrentInputValue}
                placeholder="Search to add topics"
              />
            </div>
            <div className="details__cn__desc">
              <label htmlFor="going-desc" className="label details__cn__desc__label">
                Briefly describe the topics you are interested in
              </label>
              <TextArea name="reason" id="going-desc" maxLength={250} placeholder="Enter details here" defaultValue={formValues?.reason} onChange={handleChange} />
              <span className="details__cn__desc__count">{250 - formValues?.reason?.length} characters remaining</span>
            </div>
            <div className="details__cn__oh">
              <label htmlFor="going-office-hours" className="label details__cn__oh__label">
                Office Hours
              </label>
              <input
                type="text"
                name="officeHours"
                className="details__cn__oh__field"
                id="going-office-hours"
                placeholder={registeredGuest?.officeHours === '' && connectDetail?.officeHours !== '' ? connectDetail.officeHours : 'Enter link here'}
                value={formValues?.officeHours}
                onChange={handleChange}
                ref={officeHoursRef}
                onFocus={handleOfficeHoursFocus}
                onBlur={() => handleHideWarning('oh-message')}
              />
              <div className="details__cn__oh__info">
                <img src="/icons/info.svg" alt="info" width={16} height={16} />
                <p className="details__cn__oh__info__text">
                  Please share your calendar link to facilitate scheduling for in-person meetings during the conference. Updating your availability for the conference week allows others to book time
                  with you for face-to-face connections.{' '}
                  <Link href={OH_GUIDELINE_URL} legacyBehavior>
                    <a target="_blank" className="details__cn__oh__info__text__link" onClick={handleOHGuidlineClick}>
                      Click Here
                    </a>
                  </Link>{' '}
                  to view our office hours guidelines.
                </p>
              </div>
              <div className="details__cn__oh__warning hidden-message" id="oh-message">
                <img src="/icons/info-yellow.svg" alt="info" width={16} height={16} />
                <p className="details__cn__oh__warning__msg">Any changes made here will also update your directory profile&apos;s Office Hours link, except for deletions.</p>
              </div>
            </div>
            {eventDetails?.isExclusionEvent && (
              <div className="details__cn__spl">
                <div className="details__cn__spl__date">
                  <div className="details__cn__spl__date__in">
                    <label htmlFor="check-in-date" className="label details__cn__spl__date__in__label">
                      Arrival Date
                    </label>
                    <input
                      type="date"
                      className="details__cn__spl__date__in__field"
                      name="checkInDate"
                      id="check-in-date"
                      autoComplete="off"
                      min={dateRange.dateFrom}
                      max={arrivalMaxDate}
                      onChange={onAdditionalInfoChange}
                      value={formValues?.additionalInfo?.checkInDate}
                    />
                    {formValues?.additionalInfo?.checkInDate && (
                      <button className="details__cn__spl__date__in__close" onClick={() => onClearDate('checkInDate')}>
                        <img src="/icons/close-tags.svg" alt="close" />
                      </button>
                    )}
                    {formErrors?.checkInDate && <span className="error">{formErrors?.checkInDate}</span>}
                  </div>
                  <div className="details__cn__spl__date__out">
                    <label htmlFor="check-out-date" className="label details__cn__spl__date__out__label">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      className="details__cn__spl__date__out__field"
                      name="checkOutDate"
                      id="check-out-date"
                      autoComplete="off"
                      min={departureMinDate}
                      max={dateRange.dateTo}
                      onChange={onAdditionalInfoChange}
                      value={formValues?.additionalInfo?.checkOutDate}
                    />
                    {formValues?.additionalInfo?.checkOutDate && (
                      <button className="details__cn__spl__date__out__close" onClick={() => onClearDate('checkOutDate')}>
                        <img src="/icons/close-tags.svg" alt="close" />
                      </button>
                    )}
                    {formErrors?.checkOutDate && <span className="error">{formErrors?.checkOutDate}</span>}
                  </div>
                </div>
                {formErrors?.maxDate && <span className="error">{formErrors?.maxDate}</span>}
                <div className="details__cn__spl__info">
                  <img src="/icons/info.svg" alt="info" width={16} height={16} />
                  <p className="details__cn__spl__info__text">
                    Please note that your arrival and departure dates must fall within five days before or after the official event dates ({startAndEndDateInfo}).
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="details__btns">
          <button onClick={onClose} className="details__btns__close" type="button">
            Close
          </button>
          <button className="details__btns__save" type="submit">
            {isUserGoing ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
      <RegsiterFormLoader />
      <style jsx>
        {`
          .details {
            padding: 24px 0;
            width: 320px;
            max-height: 80svh;
            display: flex;
            flex-direction: column;
            gap: 20px;
            overflow-y: auto;
          }

          .details__title {
            padding: 0 20px;
          }

          .details__cn {
            max-height: 100%;
            display: flex;
            flex-direction: column;
            gap: 20px;
            overflow-y: auto;
            padding: 0px 20px;
          }

          .label {
            font-weight: 600;
            font-size: 14px;
            line-height: 20px;
            color: #0f172a;
          }

          .error {
            font-weight: 400;
            font-size: 13px;
            line-height: 18px;
            color: #ef4444;
          }

          .details__cn__team {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .details__cn__telegram {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
            position: relative;
          }

          .details__cn__telegram__field {
            width: 100%;
            padding: 8px 12px 8px 24px;
            border: 1px solid lightgrey;
            border-radius: 8px;
            min-height: 40px;
            font-size: 14px;
          }

          .details__cn__oh__field {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid lightgrey;
            border-radius: 8px;
            min-height: 40px;
            font-size: 14px;
          }

          .details__cn__telegram__field:focus-visible,
          .details__cn__telegram__field:focus,
          .details__cn__oh__field:focus-visible,
          .details__cn__oh__field:focus {
            outline: 1px solid #156ff7;
          }
          ::placeholder {
            color: #aab0b8;
          }

          .details__cn__telegram__handle {
            position: absolute;
            top: 40px;
            left: 7px;
            color: #475569;
          }

          .details__cn__telegram__info {
            display: flex;
            align-items: flex-start;
            gap: 6px;
          }

          .details__cn__telegram__info__text {
            font-weight: 500;
            font-size: 13px;
            line-height: 18px;
            color: #94a3b8;
          }

          .details__cn__telegram__info__text__link {
            font-style: italic;
            text-decoration-line: underline;
            text-underline-offset: 2px;
          }

          .details__cn__telegram__warning {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            border-radius: 8px;
            background: #ff820e1a;
            padding: 16px 12px;
          }

          .details__cn__telegram__warning__msg {
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #0f172a;
          }

          .details__cn__topics {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .details__cn__desc {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .details__cn__desc {
            textarea:focus {
              outline: 1px solid #156ff7;
            }
          }

          .details__cn__desc__count {
            font-weight: 400;
            font-size: 13px;
            line-height: 18px;
            color: #0f172a;
          }

          .details__cn__oh {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .details__cn__oh__info {
            display: flex;
            align-items: flex-start;
            gap: 6px;
          }

          .details__cn__oh__info__text {
            font-weight: 500;
            font-size: 13px;
            line-height: 18px;
            color: #94a3b8;
          }

          .details__cn__oh__info__text__link {
            color: #156ff7;
          }

          .details__cn__oh__warning {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            border-radius: 8px;
            background: #ff820e1a;
            padding: 16px 12px;
          }

          .details__cn__oh__warning__msg {
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #0f172a;
          }

          .details__cn__spl {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .details__cn__spl__date {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .details__cn__spl__date__in {
            width: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
          }

          .details__cn__spl__date__in__close {
            position: absolute;
            right: 35px;
            top: 44px;
            margin: auto;
          }

          .details__cn__spl__date__out {
            width: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
          }

          .details__cn__spl__date__out__close {
            position: absolute;
            right: 35px;
            top: 44px;
          }

          .details__cn__spl__date__in__label,
          .details__cn__spl__date__out__label {
            margin-bottom: 12px;
          }

          .details__cn__spl__date__in__field,
          .details__cn__spl__date__out__field {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid lightgrey;
            border-radius: 8px;
            min-height: 40px;
            font-size: 14px;
            font-family: inherit;
          }

          .details__cn__spl__date__in__field:focus-visible,
          .details__cn__spl__date__in__field:focus,
          .details__cn__spl__date__out__field:focus-visible,
          .details__cn__spl__date__out__field:focus {
            outline: 1px solid #156ff7;
          }

          .details__cn__spl__info {
            display: flex;
            align-items: flex-start;
            gap: 6px;
          }

          .details__cn__spl__info__text {
            font-weight: 500;
            font-size: 13px;
            line-height: 18px;
            color: #94a3b8;
          }

          .details__btns {
            padding: 0 20px;
            margin-bottom: 20px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 8px;
          }

          .details__btns__close {
            padding: 10px 24px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background-color: #ffffff;
            color: #0f172a;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .details__btns__close:hover {
            border: 1px solid #94a3b8;
          }

          .details__btns__save {
            padding: 10px 24px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background-color: #156ff7;
            color: #ffffff;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .details__btns__save:hover {
            background-color: #1d4ed8;
          }

          .hidden-message {
            display: none;
          }

          .visible-message {
            display: flex;
          }

          @media (min-width: 820px) {
            .details {
              width: 640px;
            }

            .details__cn__spl__date {
              flex-direction: row;
              justify-content: space-between;
            }
          }
        `}
      </style>
    </>
  );
};

export default GoingDetail;
