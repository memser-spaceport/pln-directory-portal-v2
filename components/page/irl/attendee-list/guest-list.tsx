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

  if (
    events?.upcomingEvents?.length > 0 &&
    events?.pastEvents?.length === 0 &&
    filteredList.length === 0 &&
    !hasFiltersApplied
  ) {
    return (
      <>
        <div className="guestList__empty__current">
          <img width={182} height={118} src="/images/irl/attendees.svg" alt="attendees empty" />
          <p className="guestList__empty__current__text">You could be one of the very first to join!</p>
          <p className="guestList__empty__current__text__secondary">Claim your spot as one of the pioneers</p>
          {filteredGatherings?.length > 0 && (
            <button onClick={onRegisterToday} className="guestList__empty__current__button">
              Register Today
            </button>
          )}
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
            font-size: 16px;
            line-height: 20px;
            letter-spacing: 0.01em;
            color: #0f172a;
            margin-top: 24px;
          }

          .guestList__empty__current__text__secondary {
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            letter-spacing: 0px;
            color: #000000;
            margin-top: 8px;
          }

          .guestList__empty__current__button {
            background: #156ff7;
            border: 1px solid #cbd5e1;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            letter-spacing: 0px;
            color: #ffffff;
            height: 40px;
            border-radius: 8px;
            padding: 9px 16px;
            margin-top: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
        `}</style>
      </>
    );
  }

  if (filteredList.length === 0 && !hasFiltersApplied) {
    return (
      <>
        <div className="guestList__empty__current">
          <img width={182} height={118} src="/images/irl/attendees.svg" alt="attendees empty" />
          <p className="guestList__empty__current__text">Registration is opening up! Be among the first to sign up </p>
          <p className="guestList__empty__current__text__secondary">Check out who has attended in the past</p>
          <button onClick={onViewPastAttendees} className="guestList__empty__current__button">
            View Past Attendees
            <img src="/images/irl/attendees-avatar-group.svg" alt="avatar group" />
          </button>
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
            font-size: 16px;
            line-height: 20px;
            letter-spacing: 0.01em;
            color: #0f172a;
            margin-top: 24px;
          }

          .guestList__empty__current__text__secondary {
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            letter-spacing: 0px;
            color: #000000;
            margin-top: 8px;
          }

          .guestList__empty__current__button {
            background: #156ff7;
            border: 1px solid #cbd5e1;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            font-weight: 500;
            font-size: 14px;
            line-height: 20px;
            letter-spacing: 0px;
            color: #ffffff;
            height: 40px;
            border-radius: 8px;
            padding: 9px 16px;
            margin-top: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
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
