'use client';

import { abbreviateString } from '@/utils/irl.utils';
import { PAGE_ROUTES } from '@/utils/constants';
import Link from 'next/link';
import { useState } from 'react';
import { useIrlAnalytics } from '@/analytics/irl.analytics';

const IrlHeader = ({ searchParams, locationDetails }: { searchParams?: any; locationDetails?: any[] }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const analytics = useIrlAnalytics();
  const irlLocation = (searchParams?.location?.toLowerCase() || locationDetails?.[0]?.location?.toLowerCase())?.split(',')[0];

  const scheduleEnabledLocations = process.env.SCHEDULE_ENABLED_LOCATIONS?.split(',');

  const isScheduleEnabled = scheduleEnabledLocations?.includes(irlLocation) || false;

  const updatedIrlLocation = abbreviateString(irlLocation);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleSubmitEventClick = () => {
    analytics.trackSubmitEventClick({
      location: irlLocation,
      link: `${process.env.IRL_SUBMIT_FORM_URL}/add`,
    });
  };

  const handleManageEventsClick = () => {
    analytics.trackManageEventsClicked({
      location: irlLocation,
      link: `${process.env.IRL_SUBMIT_FORM_URL}?location=${updatedIrlLocation}&status=${encodeURIComponent('my events')}`,
    });
  };

  return (
    <>
      <div className="irlheaderCnt">
        <div className="irlHeaderCntr">
          <div className="irlHeaderCntrLeft">
            <a href={PAGE_ROUTES.EVENTS}>
              <img src="/icons/rounded-left-arrow.svg" alt="Back To Events" />
            </a>
            <div className="irlHeader">IRL Gatherings</div>
          </div>
          <div className="irlsubHeader__actions">
              <div className="desktopActions">
                <Link href={`${process.env.IRL_SUBMIT_FORM_URL}/add`} legacyBehavior target="_blank">
                  <a target="_blank" className="root__submit" onClick={handleSubmitEventClick}>
                    <img src="/icons/doc.svg" height={16} width={16} alt="document" />
                    Submit an event
                  </a>
                </Link>
                <Link href={`${process.env.IRL_SUBMIT_FORM_URL}?location=${updatedIrlLocation}&status=${encodeURIComponent('my events')}`} legacyBehavior target="_blank">
                  <a target="_blank" className="root__submit" onClick={handleManageEventsClick}>
                    <img src="/icons/settings-blue.svg" height={16} width={12} alt="settings" />
                    Manage
                  </a>
                </Link>
              </div>

              {/* Mobile Action Button with Dropdown */}
              <div className="mobileActions">
                <button className="mobileActionButton" onClick={toggleDropdown}>
                  <span>Organize +</span>
                </button>

                {isDropdownOpen && (
                  <div className="mobileDropdown">
                    <Link href={`${process.env.IRL_SUBMIT_FORM_URL}/add`} target="_blank" onClick={closeDropdown}>
                      <div className="mobileDropdown__item">
                        <img src="/icons/doc.svg" height={16} width={16} alt="document" />
                        <span>Submit an event</span>
                      </div>
                    </Link>
                    <Link href={`${process.env.IRL_SUBMIT_FORM_URL}?location=${updatedIrlLocation}&status=${encodeURIComponent('my events')}`} target="_blank" onClick={closeDropdown}>
                      <div className="mobileDropdown__item">
                        <img src="/icons/settings-blue.svg" height={16} width={16} alt="settings" />
                        <span>Manage my events</span>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
        </div>
        <div className="irlheaderCnt__text">Choose a destination to view upcoming gathering, attendees, resources & let the network know about your presence</div>

        {/* {isScheduleEnabled && ( */}
 
      </div>
      <style jsx>
        {`
          .irlHeader {
            font-size: 24px;
            font-weight: 600;
            line-height: 28px;
            padding-bottom: 5px;
            color: #374151;
          }

          .irlheaderCnt__text {
            font-size: 14px;
            font-weight: 400;
            color: #0f172a;
            margin-top: 8px;
          }

          .irlsubHeader {
            font-size: 14px;
            font-weight: 400;
            display: flex;
            align-items: center;
            border: 1px solid transparent;
            border-radius: 8px;
            gap: 10px;
            padding: 15px 12px;
            position: relative;
            overflow: visible;
            margin-top: 14px;
            background-image: url('/icons/irl.svg');
            background-repeat: no-repeat;
            background-position: center;
            background-size: cover;
          }

          .irlsubHeader::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 8px;
            padding: 1px;
            background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
            -webkit-mask:
              linear-gradient(#fff 0 0) content-box,
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
          }

          .irlsubHeader__text {
            font-size: 15px;
            font-weight: 500;
            line-height: 20px;
            color: #000000;
            flex: 1;
            position: relative;
            // z-index: 1;
          }

          .irlsubHeader__actions {
            display: flex;
            gap: 12px;
            align-items: center;
            position: relative;
            // z-index: 1;
            overflow: visible;
          }

          .irlHeaderCntr {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .irlHeaderCntrLeft__left {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .irlHeaderCntrLeft {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .irlheaderCnt {
            padding: 18px 16px 10px 16px;
          }

          .root__submit {
            background-color: #ffffff;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 10px;
            border-radius: 8px;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            white-space: nowrap;
            border: 1px solid var(--Neutral-Slate-300, #cbd5e1);
          }

          .mobileActionButton {
            background-color: #ffffff;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            align-items: center;
            gap: 5px;
            padding: 10px;
            border-radius: 8px;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            border: 1px solid var(--Neutral-Slate-300, #cbd5e1);
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .mobileDropdown {
            position: absolute;
            top: 40px;
            right: 0;
            z-index: 1;
            margin-top: 8px;
            overflow: visible;
            background-color: #ffffff;
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0px 2px 6px 0px #0f172a29;
            min-width: 181px;
          }

          .mobileDropdown__item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            color: #0f172a;
            text-decoration: none;
            font-weight: 400;
            font-size: 14px;
            transition: background-color 0.2s ease;
            cursor: pointer;
          }

          .mobileDropdown__item:hover {
            border-radius: 4px;
            background-color: #f1f5f9;
          }

          /* Mobile styles (default) */
          .desktopActions {
            display: none;
          }

          .mobileActions {
            display: block;
            position: relative;
            overflow: visible;
          }

          .irlsubHeader__actions {
            justify-content: flex-end;
            flex-shrink: 0;
          }

          @media (min-width: 760px) {
            .irlsubHeader {
              padding: 12px 12px 12px 20px;
              gap: 10px;
            }

            .irlsubHeader__actions {
              gap: 16px;
              justify-content: unset;
            }

            .desktopActions {
              display: flex;
              gap: 12px;
            }

            .mobileActions {
              display: none;
            }

            .irlheaderCnt {
              padding: 24px 5px 15px 5px;
            }
          }
        `}
      </style>
    </>
  );
};

export default IrlHeader;
