import { Dispatch, SetStateAction, useEffect } from 'react';

import { EVENTS } from '@/utils/constants';
import { IUserInfo } from '@/types/shared.types';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import GuestTableRow from './guest-table-row';
import { IAnalyticsGuestLocation, IGuest, IGuestDetails } from '@/types/irl.types';
import { useRouter } from 'next/navigation';
import { triggerLoader } from '@/utils/common.utils';

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
}

const GuestList = (props: IGuestList) => {
  const userInfo = props?.userInfo;
  const eventDetails = props?.eventDetails;
  const showTelegram = props?.showTelegram;
  const filteredList = props?.items;
  const selectedGuests = props?.selectedGuests;
  const setSelectedGuests = props?.setSelectedGuests;
  const location = props?.location;
  const isLoggedIn = props.isLoggedIn;
  const onLogin = props.onLogin;
  const searchParams = props?.searchParams;
  const isAdminInAllEvents = props?.isAdminInAllEvents;

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

  }

  useEffect(() => {
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_FLOATING_BAR, {
        detail: {
          isOpen: selectedGuests.length > 0,
        },
      })
    );

    if (selectedGuests.length > 0) {
      analytics.trackFloatingBarOpen(location, { selectedGuests });
    }
  }, [selectedGuests]);

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
                />
              </div>
            );
          })}
        {filteredList.length === 0 && (
          <div className="guestList__empty">
            No results found for the applied input <span role='button' onClick={onClearFilters} className="guestList__empty__reset">Reset to default</span>
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
