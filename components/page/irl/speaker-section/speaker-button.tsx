import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { EVENTS } from '@/utils/constants';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { getSpeakerRequestStatus } from '@/services/irl.service';
import { getParsedValue } from '@/utils/common.utils';
import { Tooltip } from '@/components/core/tooltip/tooltip';

interface SpeakerButtonProps {
  eventLocationSummary: any;
  userInfo: any;
  currentGuest: any;
}

type SpeakerRequestStatus = '' | 'PENDING' | 'APPROVED';

const SpeakerButton = ({ eventLocationSummary, userInfo, currentGuest }: SpeakerButtonProps) => {
  const analytics = useIrlAnalytics();
  const [status, setStatus] = useState<SpeakerRequestStatus>('');
  const [approvedEvents, setApprovedEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApprovedDropdownOpen, setIsApprovedDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch speaker request status on component mount
  useEffect(() => {
    const fetchSpeakerRequestStatus = async () => {
      if (!userInfo?.uid || !eventLocationSummary?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const authToken = getParsedValue(Cookies.get('authToken'));
        
        if (!authToken) {
          setIsLoading(false);
          return;
        }

        const response = await getSpeakerRequestStatus(
          eventLocationSummary.uid,
          userInfo.uid,
          authToken
        );

        if (!response.isError && response.data) {
          const requestData = response.data;
          const requestStatus = requestData[0]?.status || '';
          
          setStatus(requestStatus as SpeakerRequestStatus);
          
          // If approved, set the events
          if (requestStatus === 'APPROVED' && requestData[0]?.events) {
            setApprovedEvents(Array.isArray(requestData[0].events) ? requestData[0].events : []);
          } else {
            setApprovedEvents([]);
          }
        } else {
          setStatus('');
          setApprovedEvents([]);
        }
      } catch (error) {
        console.error('Error fetching speaker request status:', error);
        setStatus('');
        setApprovedEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpeakerRequestStatus();
  }, [userInfo?.uid, eventLocationSummary?.uid]);

  const approvedEventsCount = approvedEvents.length;

  // Listen for speaker request submission to update status
  useEffect(() => {
    const handleSpeakerSubmitted = (e: any) => {
      const locationId = e.detail?.locationId;
      // Only update if this is for the same location
      if (locationId === eventLocationSummary?.uid) {
        setStatus('PENDING');
        setApprovedEvents([]);
      }
    };

    document.addEventListener(EVENTS.SPEAKER_REQUEST_SUBMITTED, handleSpeakerSubmitted);
    
    return () => {
      document.removeEventListener(EVENTS.SPEAKER_REQUEST_SUBMITTED, handleSpeakerSubmitted);
    };
  }, [eventLocationSummary?.uid]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsApprovedDropdownOpen(false);
      }
    };

    if (isApprovedDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isApprovedDropdownOpen]);

  const handleClickSpeakerPopUp = () => {
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_SPEAKER_REQUEST_POPUP, {
        detail: { isOpen: true },
      }),
    );
    analytics.trackBeSpeakerBtnClicked(eventLocationSummary, userInfo);
  };

  return (
    <>
      <div className="speakerRoot">
        <button
          className={`speakerRoot__button ${isLoading ? 'speakerRoot__button--loading' : ''}`}
          onClick={handleClickSpeakerPopUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="speakerRoot__button__text">Loading...</span>
          ): (
            <span className="speakerRoot__button__text">Be a Speaker</span>
          )}
        </button>
        
        <div className="speakerApprovedWrapper" ref={dropdownRef}>
          {!isLoading && (
             <button
                className={`speakerRoot__button speakerRoot__button--approved`}
                onClick={() => setIsApprovedDropdownOpen((prev) => !prev)}
                >
                <Image
                        src="/icons/irl/speaker-icon.svg"
                        alt="Speaker"
                        width={20}
                        height={20}
                        className="speakerRoot__button__icon"
                    />
                    <span className="speakerRoot__button__text speakerRoot__button__text--approved">
                        Approved ({approvedEventsCount} {approvedEventsCount <= 1 ? 'event' : 'events'})
                    </span>
                    {
                      approvedEventsCount > 0 && (
                        <img
                        src="/icons/arrow-up.svg"
                        alt="Toggle"
                        width={12}
                        height={12}
                        className={`speakerRoot__button__arrow ${isApprovedDropdownOpen ? 'speakerRoot__button__arrow--open' : ''}`}
                    />
                    )
                    }
            </button>
          )}

            {isApprovedDropdownOpen && (
            <div className="speakerRoot__dropdown">
                <div className="speakerRoot__dropdown__list">
                    {approvedEvents?.map((event: any) => (
                    <div key={event.eventUid} className="speakerRoot__dropdown__item">
                    <div className="speakerRoot__dropdown__item__logo">
                         <Image
                            src="/icons/irl-event-default-logo.svg"
                            alt={event.eventName}
                            width={32}
                            height={32}
                            className="speakerRoot__dropdown__item__logoImg"
                        />
                    </div>
                    <span className="speakerRoot__dropdown__item__name">{event.eventName}</span>
                      <Tooltip
                        asChild
                        trigger={
                          <Image
                            alt="left"
                            height={16}
                            width={16}
                            src="/icons/info.svg"
                            style={{ marginLeft: '5px', top: '2px', position: 'relative' }}
                          />
                        }
                        content={event.eventName}
                      />
                    </div>
                ))}
                </div>
            </div>
            )}
        </div>
      </div>
      <style jsx>
        {`
          .speakerRoot {
            position: relative;
            display: flex;
            gap: 12px;
          }

          .speakerRoot__button {
            padding: 9px 2px;
            border: 1px solid rgba(203, 213, 225, 1);
            background: rgba(21, 111, 247, 1);
            border-radius: 5px;
            display: flex;
            gap: 4px;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            box-shadow: 0px 1px 1px 0px rgba(15, 23, 42, 0.08);
            cursor: pointer;
            width: 180px;
          }

          .speakerApprovedWrapper {
            position: relative;
          }

          .speakerRoot__button--approved {
            background: #ffffff;
            border: 1px solid rgba(21, 111, 247, 1);
          }

          .speakerRoot__button:disabled {
            cursor: default;
            opacity: 1;
          }

          .speakerRoot__button--loading {
            opacity: 0.7;
          }

          .speakerRoot__button--submitted {
            background: #ffffff;
            border: 1px solid rgba(21, 111, 247, 1);
            box-shadow: 0px 1px 1px 0px rgba(15, 23, 42, 0.08);
          }

          .speakerRoot__button__arrow {
            transition: transform 0.2s ease;
            flex-shrink: 0;
          }

          .speakerRoot__button__arrow--open {
            transform: rotate(180deg);
          }

          .speakerRoot__button__icon {
            flex-shrink: 0;
          }

          .speakerRoot__button__text {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            color: rgba(255, 255, 255, 1);
          }

          .speakerRoot__button__text--approved {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            color: rgba(15, 23, 42, 1);
          }

          .speakerRoot__button__checkmark {
            flex-shrink: 0;
          }

          .speakerRoot__dropdown {
            position: absolute;
            top: 100%;
            right: -8px;
            margin-top: 12px;
            background: #ffffff;
            border: 1px solid rgba(203, 213, 225, 1);
            border-radius: 8px;
            box-shadow: 0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06);
            z-index: 1000;
            max-width: 300px;
            max-height: 300px;
            overflow-y: auto;
          }

          .speakerRoot__dropdown__list {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .speakerRoot__dropdown__item {
            display: flex;
            align-items: center;
            padding: 0 12px;
            gap: 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
            height: 50px;
          }

          .speakerRoot__dropdown__item:hover {
            background-color: rgba(248, 250, 252, 1);
          }

          .speakerRoot__dropdown__item__logo {
            width: 32px;
            height: 32px;
            border-radius: 4px;
            overflow: hidden;
            flex-shrink: 0;
            background-color: rgba(241, 245, 249, 1);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .speakerRoot__dropdown__item__logoImg {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .speakerRoot__dropdown__item__logoPlaceholder {
            width: 100%;
            height: 100%;
            background-color: rgba(203, 213, 225, 1);
          }

          .speakerRoot__dropdown__item__name {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            color: rgba(15, 23, 42, 1);
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /* Scrollbar styling for dropdown */
          .speakerRoot__dropdown::-webkit-scrollbar {
            width: 6px;
          }

          .speakerRoot__dropdown::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
          }

          .speakerRoot__dropdown::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
          }

          .speakerRoot__dropdown::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }

          @media (min-width: 768px) {
            .speakerRoot {
              width: 100%;
            }

            .speakerRoot__button {
              padding: 9px;
              width: fit-content;
            }
          }

          @media (min-width: 1024px) {
            .speakerRoot {
              width: fit-content;
            }
          }
        `}
      </style>
    </>
  );
};

export default SpeakerButton;
