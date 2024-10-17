import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { IIrlLocation } from '@/types/irl.types';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsLocationInfo, getAnalyticsUserInfo, getTelegramUsername, removeAtSymbol } from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface ITelegramHandle {
  initialValues: any;
  scrollTo: string;
  userInfo: IUserInfo | null;
  location: IIrlLocation
}

const TelegramHandle = (props: ITelegramHandle) => {
  // const telegramId = props?.telegramId;

  const initialValues = props?.initialValues;
  const scrollTo = props?.scrollTo;
  const location = props?.location;

  const [isTelegramNote, setIsTelegramNote] = useState(false);
  const [telegramId, setTelegramId] = useState('');
  const [isHiddenTelegram, setIsHiddenTelegram] = useState(false);
  const telegramRef: any = useRef(null);
  const analytics = useIrlAnalytics();

  const handleChange = (e: any) => {
    setTelegramId(e.target.value);
  };

  const handleTelegramFocus = () => {
    setIsTelegramNote(true);
  };

  const onFocusBlur = () => {
    setIsTelegramNote(false);
  };

  const handlePrivacySettingClick = () => {
    analytics.irlGuestDetailPrivacySettingClick(getAnalyticsUserInfo(props?.userInfo), getAnalyticsLocationInfo(location));
  };

  useEffect(() => {
    function handler(e: any) {
      const formattedValue = removeAtSymbol(e?.detail?.telegramHandle || "");
      setTelegramId(getTelegramUsername(formattedValue));
      setIsHiddenTelegram(!e.detail?.showTelegram);
    }
    document.addEventListener(EVENTS.UPDATE_TELEGRAM_HANDLE, (e: any) => {
      handler(e);
    });
    return () => {
      document.removeEventListener(EVENTS.UPDATE_TELEGRAM_HANDLE, (e: any) => {
        handler(e);
      });
    };
  }, []);

  useEffect(() => {
    if (initialValues) {
      const formattedValue = removeAtSymbol(initialValues?.telegramId || "");
      setTelegramId(getTelegramUsername(formattedValue));
    } else {
      setIsTelegramNote(false);
      setIsHiddenTelegram(false);
      setTelegramId('');
    }
  }, [initialValues]);

  useEffect(() => {
    if(scrollTo === "telegram-section") {
      if (telegramRef.current) {
        telegramRef.current.focus();
      }
    }
  }, [])


  return (
    <>
      <div className="details__cn__telegram">
        <div className="label details__cn__telegram__label">Telegram Handle</div>
        <input
          name="telegramId"
          id="going-telegram"
          placeholder={telegramId ? telegramId : 'Enter handle here'}
          className="details__cn__telegram__field"
          value={telegramId}
          onChange={handleChange}
          onFocus={handleTelegramFocus}
          onBlur={() => onFocusBlur()}
          ref={telegramRef}
        />
        <span className="details__cn__telegram__handle">@</span>
        {isHiddenTelegram && (
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
        {isTelegramNote && (
          <div className="details__cn__telegram__warning hidden-message" id="telegram-message">
            <img src="/icons/info-yellow.svg" alt="info" width={16} height={16} />
            <p className="details__cn__telegram__warning__msg">Any changes made here will also update your directory profile&apos;s Telegram handle.</p>
          </div>
        )}
      </div>

      <style jsx>
        {`
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
            top: 39px;
            left: 7px;
            color: #475569;
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
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

          .label {
            font-weight: 600;
            font-size: 14px;
            line-height: 20px;
            color: #0f172a;
          }
        `}
      </style>
    </>
  );
};

export default TelegramHandle;
