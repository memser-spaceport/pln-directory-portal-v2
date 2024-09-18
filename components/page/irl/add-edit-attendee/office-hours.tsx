import { EVENTS, OH_GUIDELINE_URL } from '@/utils/constants';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const OfficeHours = (props: any) => {
  const [officeHours, setOfficeHours] = useState(props?.officeHours);
  const [isFocusNote, setIsFocusNote] = useState(false);

  const handleOHGuidlineClick = () => {
    // analytics.irlGuestDetailPrivacySettingClick(getAnalyticsUserInfo(userInfo), { eventId: eventDetails?.id, eventName: eventDetails?.name });
  };

  const handleChange = (e: any) => {
    setOfficeHours(e.target.value);
  };

  const handleOfficeHoursFocus = () => {
    setIsFocusNote(true);
  };

  useEffect(() => {
    function handler(e: any) {
      console.log("officehour ", e)
      setOfficeHours(e?.detail?.officeHours || "");
    }
    document.addEventListener(EVENTS.UPDATE_OFFICE_HOURS, (e: any) => {
      handler(e);
    });

    return () => {
      document.removeEventListener(EVENTS.UPDATE_OFFICE_HOURS, (e: any) => {
        handler(e);
      });
    };
  }, []);
  return (
    <>
      <div className="details__cn__oh">
        <div className="label details__cn__oh__label">
          Office Hours
        </div>
        <input
          type="text"
          name="officeHours"
          className="details__cn__oh__field"
          id="going-office-hours"
          placeholder={officeHours ? officeHours : 'Enter link here'}
          value={officeHours}
          onChange={handleChange}
          onFocus={handleOfficeHoursFocus}
          onBlur={() => setIsFocusNote(false)}
        />
        <div className="details__cn__oh__info">
          <img src="/icons/info.svg" alt="info" width={16} height={16} />
          <p className="details__cn__oh__info__text">
            Please share your calendar link to facilitate scheduling for in-person meetings during the conference. Updating your availability for the conference week allows others to book time with
            you for face-to-face connections.
            <Link href={OH_GUIDELINE_URL} legacyBehavior>
              <a target="_blank" className="details__cn__oh__info__text__link" onClick={handleOHGuidlineClick}>
                Click Here
              </a>
            </Link>
            to view our office hours guidelines.
          </p>
        </div>
        {isFocusNote && (
          <div className="details__cn__oh__warning hidden-message" id="oh-message">
            <img src="/icons/info-yellow.svg" alt="info" width={16} height={16} />
            <p className="details__cn__oh__warning__msg">Any changes made here will also update your directory profile&apos;s Office Hours link, except for deletions.</p>
          </div>
        )}
      </div>

      <style jsx>
        {`
          .label {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
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
        `}
      </style>
    </>
  );
};

export default OfficeHours;
