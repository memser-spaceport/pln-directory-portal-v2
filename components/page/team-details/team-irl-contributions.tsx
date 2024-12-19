'use client';

import { Fragment, useRef, useState } from 'react';
import Modal from '@/components/core/modal';
import { IMember } from '@/types/members.types';
import { IAnalyticsUserInfo, IUserInfo } from '@/types/shared.types';
import React from 'react';
import { getFormattedDateString } from '@/utils/member.utils';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { ITeam } from '@/types/teams.types';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { format, toZonedTime } from 'date-fns-tz';
import { sortEventsByDate } from '@/utils/irl.utils';

interface IEvent {
  uid: string;
  name: string;
  type: string | null;
  slugURL: string;
  startDate: string;
  endDate: string;
  location: any;
}

interface IEventGuest {
  uid: string;
  isHost: boolean;
  event: IEvent;
}

interface GroupedEvents {
  Host: IEvent[];
}

interface ITeamMembers {
  members: IMember[] | undefined;
  teamId: string;
  team: ITeam | undefined;
  userInfo: IAnalyticsUserInfo;
}

const TeamIrlContributions = (props: ITeamMembers) => {
  const userInfo = props?.userInfo;
  const modalRef = useRef<HTMLDialogElement>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const analytics = useTeamAnalytics();

  const team = props?.team?.eventGuests;
  const sortedEvents = sortEventsByDate(team);

  const transformData = (event: IEventGuest[]): GroupedEvents => {
    return event.reduce(
      (acc: GroupedEvents, item) => {
        acc.Host.push(item.event);
        return acc;
      },
      { Host: [] }
    );
  };

  const groupedData: GroupedEvents = team ? transformData(sortedEvents) : { Host: [] };

  const onClose = () => {
    if (modalRef.current) {
      modalRef.current.close();
    }
  };

  const onClickHandler = (role: string) => {
    if (modalRef.current) {
      setSelectedRole(role);
      modalRef.current.showModal();
    }
    analytics.onClickSeeMoreIrlContribution(userInfo);
  };

  const handleEventClick = (details: any, role: any) => {
    analytics.onClickTeamIrlContribution(userInfo);
    const isActive = checkTimeZone(details);

    const type = isActive ? 'upcoming' : 'past';
    const location = details?.location?.location ?? '';
    const locationName = location?.split(',')[0].trim();
    const baseUrl = window.location.origin;
    let url = `irl?location=${locationName}&type=${type}`;

    if (type === 'past') {
      url += `&event=${details.slugURL}`;
    }

    const fullUrl = `${baseUrl}/${url}`;
    window.open(fullUrl, '_blank');
  };

  const checkTimeZone = (details: any) => {
    const timezone = details?.location?.timezone;
    const endDateInTargetTimezone = toZonedTime(details?.endDate, timezone);
    const currentDateInTargetTimezone = toZonedTime(new Date(), timezone);

    return endDateInTargetTimezone.getTime() > currentDateInTargetTimezone.getTime();
  };

  const getFormattedDateString = (date: string, timeZone: string) => {
    const dateInTargetTimezone = toZonedTime(date, timeZone);
    return format(dateInTargetTimezone, 'MMM yyyy', { timeZone });
  };

  return (
    <>
      <div className="root">
        <div className="root__header">IRL Contributions ({team?.length})</div>
        <div className="root__irlCrbts">
          {Object.entries(groupedData).map(([role, events]) => {
            const visibleEvents = events?.slice(0, 5);
            const additionalCount = events?.length - visibleEvents?.length;

            return (
              <div key={role} className="root__irlCrbts__row root__irlCrbts__row__border__btm">
                <div className="root__irlCrbts__col root__irlCrbts__row__border__right">
                  <img src={`/icons/${role.toLowerCase()}_icon.svg`} alt={role.toLowerCase()} />
                  {role}
                </div>
                <div className="root__irlCrbts__col__event">
                  {visibleEvents.map((details: any, index: React.Key | null | undefined) => {
                    const isActive = checkTimeZone(details);
                    return (
                      <Tooltip
                        key={index}
                        asChild
                        align="start"
                        side="top"
                        content={<div className="root__irlCrbts__col__event__cnt__title--tooltip">{details?.name}</div>}
                        trigger={
                          <div
                            className={`root__irlCrbts__col__event__cnt ${isActive ? 'active' : 'inActive'}`}
                            onClick={() => {
                              handleEventClick(details, role);
                            }}
                          >
                            <div className="root__irlCrbts__col__event__cnt__title">{details?.name}</div>
                            <div className="root__irlCrbts__col__event__cnt__date">{getFormattedDateString(details?.startDate, details?.location?.timeZone)}</div>
                          </div>
                        }
                      />
                    );
                  })}
                  {additionalCount > 0 && (
                    <div className="root__irlCrbts__col__event__cnts additional-count" onClick={() => onClickHandler(role)}>
                      +{additionalCount}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal modalRef={modalRef} onClose={onClose}>
        <div className="root__irl__addRes__popup">
          {Object.entries(groupedData)
            .filter(([role]) => role === selectedRole)
            .map(([role, events]) => (
              <>
                <div className="root__irl__modalHeader">
                  <div className="root__irl__modalHeader__title">Contributions - {role} ({events.length})</div>
                </div>
                <div className="root__irl__popupCntr">
                  {events.map((resource: { link: any; name: any }, index: number) => (
                    <div
                      key={index}
                      className={`root__irl__popupCnt ${index + 1 !== events.length ? 'divider' : ''}`}
                      onClick={() => {
                        handleEventClick(resource, role);
                      }}
                    >
                      <div className="root__irl__popupCnt__name">{resource?.name}</div>
                      <div>
                        <img src="/icons/arrow-blue.svg" alt="arrow icon" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ))}
        </div>
      </Modal>
      <style jsx>
        {`
          .root__irl__addRes__popup {
            width: 90vw;
            max-width: 656px;
            height: 394px;
            display: flex;
            overflow-y: auto;
            flex-direction: column;
            padding: 24px 8px 24px 24px;
          }
          .root__irl__header {
            padding: 15px;
            font-size: 18px;
            font-weight: 500;
            line-height: 14px;
          }
          .root__irl__modalHeader {
            display: flex;
            flex-direction: row;
            gap: 8px;
            position: absolute;
            width: 100%;
            gap: 8px;
          }

          .root__irl__modalHeader__title {
            font-size: 20px;
            font-weight: 700;
            line-height: 26px;
            text-align: left;
          }

          .root__irl__modalHeader__count {
            font-size: 14px;
            font-weight: 400;
            line-height: 32px;
            text-align: left;
            padding-top: 3px;
          }

          .root__irl__popupCntr {
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            padding: 0 10px 0 0;
            margin-top: 26px;
          }

          .root__irl__popup__header {
            font-size: 13px;
            font-weight: 400;
            line-height: 20px;
            text-align: left;
            background-color: #ffe2c8;
            margin-top: 50px;
            display: flex;
            flex-direction: row;
            height: 34px;
            justify-content: center;
            align-items: center;
            border-radius: 8px;
          }

          .root__irl__popupCnt {
            display: flex;
            flex-direction: row;
            gap: 8px;
            justify-content: space-between;
            padding: 16px;
            gap: 10px;
            cursor: pointer;
          }

          .divider {
            border-bottom: 1px solid #e2e8f0;
          }

          .active {
            position: relative;
            background: linear-gradient(71.47deg, rgba(66, 125, 255, 0.2) 8.43%, rgba(68, 213, 187, 0.2) 87.45%) !important;
            border: none !important;
          }
          .active::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 4px;
            border: 1px solid transparent;
            background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%) border-box;
            -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
            pointer-events: none;
          }
          .inactive {
            position: relative;
            border: 1px solid transparent;
            background: #f1f5f9;
          }

          .root {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .root__header {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            letter-spacing: 0px;
            text-align: left;
            color: #64748b;
          }

          .root__irlCrbts {
            width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }

          .root__irlCrbts__row {
            display: flex;
          }

          .root__irlCrbts__row__border__btm {
            border-bottom: 1px solid #e2e8f0;
          }

          .root__irlCrbts__col {
            width: 160px;
            height: 70px;
            display: flex;
            justify-content: left;
            align-items: center;
            gap: 10px;
            padding: 10px;
            padding-left: 20px;
          }

          .root__irlCrbts__col__event {
            display: flex;
            padding: 15px;
            flex-direction: row;
            align-items: center;
            gap: 15px;
            width: 100%;
          }

          .root__irlCrbts__col__event__cnt {
            min-width: 40px;
            max-width: 115px;
            height: 40px;
            justify-content: center;
            padding: 0px 12px;
            border-radius: 4px;
            border: 1px solid transparent;
            display: flex;
            flex-direction: column;
            cursor: pointer !important;
            border: 1px solid #cbd5e1;
            background: #f1f5f9;
          }

          .root__irl__popupCnt__name {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            color: #0f172a;
          }

          .root__irlCrbts__col__event__cnts {
            width: 40px;
            height: 40px;
            padding: 6px 12px 6px 12px;
            border-radius: 4px;
            border: 1px solid #cbd5e1;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            background: #f1f5f9;
            font-size: 12px;
            font-weight: 500;
            line-height: 14px;
            cursor: pointer;
          }

          .root__irlCrbts__col__event__cnt__title {
            font-size: 12px;
            font-weight: 500;
            line-height: 14px;
            text-align: left;
            width: 93px;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
          }

          .root__irlCrbts__col__event__cnt__title--tooltip {
            font-size: 12px;
            font-weight: 500;
            line-height: 14px;
            text-align: left;
            width: 93px;
          }

          .root__irlCrbts__col__event__cnt__date {
            font-size: 8px;
            font-weight: 500;
            line-height: 14px;
            text-align: left;
          }

          .root__irlCrbts__col__event__cnt.additional-count {
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 12px;
            font-weight: bold;
            background: #d1d5db;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 6px 12px;
            min-width: 40px;
            height: 40px;
          }

          @media (min-width: 360px) {
            .root__irlCrbts {
              min-height: 100px;
            }

            .root__irlCrbts__row {
              display: flex;
              flex-direction: column;
            }

            .root__irlCrbts__row__border__right {
              border: none;
            }

            .root__irlCrbts__col__event {
              padding: 0px 15px 15px 15px;
              flex-wrap: wrap;
            }
          }

          @media (min-width: 1024px) {
            .root__irl__addRes__popup {
              width: 656px;
            }

            .root__irl__popupCntr {
              margin-top: 30px;
            }

            .root__irl__modalHeader__title {
              line-height: 32px;
            }

            .root__irlCrbts {
              min-height: 70px;
            }

            .root__irlCrbts__row {
              height: 70px;
              display: flex;
              flex-direction: row;
            }

            .root__irlCrbts__col__event {
              padding: 15px;
              flex-wrap: nowrap;
            }

            .root__irlCrbts__row__border__right {
              border-right: 1px solid #e2e8f0;
            }
          }
        `}
      </style>
    </>
  );
};

export default TeamIrlContributions;
