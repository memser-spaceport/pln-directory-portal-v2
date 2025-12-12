import { Dispatch, SetStateAction, useEffect } from 'react';

import { EVENTS, IAM_GOING_POPUP_MODES } from '@/utils/constants';
import { IUserInfo } from '@/types/shared.types';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import GuestTableRow from './guest-table-row';
import { IAnalyticsGuestLocation, IGuest, IGuestDetails } from '@/types/irl.types';
import { useRouter } from 'next/navigation';
import { triggerLoader } from '@/utils/common.utils';
import { filterUpcomingGatherings } from '@/utils/irl.utils';

interface IGuestList {
  userInfo: IUserInfo;
  eventDetails: IGuestDetails;
  showTelegram: boolean;
  items: IGuest[];
  selectedGuests: string[];
  setSelectedGuests: Dispatch<SetStateAction<string[]>>;
  location: IAnalyticsGuestLocation;
  isLoggedIn: boolean;
  onLogin: () => void;
  searchParams: any;
  isAdminInAllEvents: any;
  newSearchParams: URLSearchParams;
  hasFiltersApplied: boolean;
}

const GuestList = (props: IGuestList) => {
  const userInfo = props?.userInfo;
  const eventDetails = props?.eventDetails;
  const events = eventDetails?.events;
  const newSearchParams = props?.newSearchParams;
  const showTelegram = props?.showTelegram;
  const filteredList = props?.items;
  const selectedGuests = props?.selectedGuests;
  const setSelectedGuests = props?.setSelectedGuests;
  const location = props?.location;
  const isLoggedIn = props.isLoggedIn;
  const onLogin = props.onLogin;
  const searchParams = props?.searchParams;
  const isAdminInAllEvents = props?.isAdminInAllEvents;
  const hasFiltersApplied = props?.hasFiltersApplied;
  const filteredGatherings = events?.upcomingEvents?.filter((gathering: any) => filterUpcomingGatherings(gathering));
  const analytics = useIrlAnalytics();
  const router = useRouter();

  const scheduleURL = `${process.env.SCHEDULE_BASE_URL}/program?location=${encodeURIComponent(location?.name)}`;

  const onchangeSelectionStatus = (uid: string) => {
    setSelectedGuests((prevSelectedIds: string[]) => {
      if (prevSelectedIds.includes(uid)) {
        return prevSelectedIds.filter((item: string) => item !== uid);
      } else {
        return [...prevSelectedIds, uid];
      }
    });
  };

  const onClearFilters = () => {
    let isTriggerLoader = false;
    const currentParams = new URLSearchParams(searchParams);
    const allowedParams = ['event', 'type', 'location'];

    // Remove parameters not in the allowed list
    for (const [key, value] of Object.entries(searchParams)) {
      if (!allowedParams?.includes(key)) {
        currentParams?.delete(key);
        isTriggerLoader = true;
      }
    }
    triggerLoader(isTriggerLoader);
    router.push(`${window.location.pathname}?${currentParams.toString()}`);
  };

  const onViewPastAttendees = () => {
    analytics.trackGuestListViewPastAttendeesClicked(location);
    triggerLoader(true);
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('type', 'past');
    router.push(`${window.location.pathname}?${currentParams.toString()}`);
  };

  const onRegisterToday = () => {
    analytics.trackGuestListRegisterTodayClicked(location);
    let formData: any = { member: userInfo };
    let props: any = { detail: { isOpen: true, formdata: { ...formData }, mode: IAM_GOING_POPUP_MODES.ADD } };
    document.dispatchEvent(new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, props));
  };

  const onEmptyGuestListImGoingClick = () => {
    if (isLoggedIn) {
      analytics.trackEmptyGuestListImGoingClicked(location, 'logged_in');
      onRegisterToday();
    } else {
      analytics.trackEmptyGuestListImGoingClicked(location, 'not_logged_in');
      onLogin();
    }
  }

  useEffect(() => {
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_FLOATING_BAR, {
        detail: {
          isOpen: selectedGuests.length > 0,
        },
      }),
    );

    if (selectedGuests.length > 0) {
      analytics.trackFloatingBarOpen(location, { selectedGuests });
    }
  }, [selectedGuests]);

  if (filteredList.length === 0 && !hasFiltersApplied) {
    return (
      <>
        <div className="guestList__empty__current">
          <img width={182} height={118} src="/images/irl/attendees.svg" alt="attendees empty" />
          <div className="guestList__empty__current__text">
          <a
            href={scheduleURL}
            target="_blank"
            className="guestList__empty__current__text__link"
            onClick={() => analytics.trackViewScheduleClick(location)}
          >
            View schedule of events
          </a> 
          {' '}in {location?.name.charAt(0).toUpperCase() + location?.name.slice(1)} and mark yourself as
         <a href="#" onClick={onEmptyGuestListImGoingClick} className="guestList__empty__current__text__link"> I am Going</a>
          {' '}if you are planning to attend.
         </div>
        </div>
        <style jsx>{`
          .guestList__empty__current {
            display: flex;
            flex-direction: column;
            width: 100%;
            align-items: center;
            padding-block: 45px;
          }

          .guestList__empty__current__text {
            font-weight: 600;
            font-size: 14px;
            line-height: 20px;
            width: 550px;
            letter-spacing: 0.01em;
            color: #0f172a;
            margin-top: 24px;
          }

          .guestList__empty__current__text__link {
            color: #156ff7;
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <div className="guestList">
        {filteredList?.length > 0 &&
          filteredList?.map((guest: IGuest, index: number) => {
            return (
              <div key={`${guest?.memberUid}-${index}`}>
                <GuestTableRow
                  guest={guest}
                  userInfo={userInfo}
                  showTelegram={showTelegram}
                  selectedGuests={selectedGuests}
                  onchangeSelectionStatus={onchangeSelectionStatus}
                  isLoggedIn={isLoggedIn}
                  onLogin={onLogin}
                  isAdminInAllEvents={isAdminInAllEvents}
                  newSearchParams={newSearchParams}
                />
              </div>
            );
          })}
        {filteredList.length === 0 && hasFiltersApplied && (
          <div className="guestList__empty">
            No results found for the applied input{' '}
            <span role="button" onClick={onClearFilters} className="guestList__empty__reset">
              Reset to default
            </span>
          </div>
        )}
      </div>
      <style jsx>
        {`
          .guestList {
            display: flex;
            flex-direction: column;
            background: #fff;
            overflow-y: auto;
            overflow-x: hidden;
          }

          .guestList__empty {
            display: flex;
            width: 100%;
            justify-content: center;
            // border-bottom: 1px solid #cbd5e1;
            padding-top: 20px;
            padding-bottom: 20px;
            font-size: 14px;
            font-weight: 500;
            color: #64748b;
            gap: 4px;
          }

          .guestList__empty__reset {
            color: #156ff7;
            cursor: pointer;
          }

          .divider {
            border-bottom: 1px solid #cbd5e1;
          }

          .text-clamp {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            overflow: hidden;
            -webkit-line-clamp: 2;
          }

          .word-break {
            word-break: break-word;
          }

          @media (min-width: 1024px) {
            .guestList {
              width: 100%;
            }
          }
        `}
      </style>
    </>
  );
};

export default GuestList;
