import { Dispatch, SetStateAction, useEffect } from 'react';

import { EVENTS } from '@/utils/constants';
import { IUserInfo } from '@/types/shared.types';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import GuestTableRow from './guest-table-row';
import { IAnalyticsGuestLocation, IGuest, IGuestDetails } from '@/types/irl.types';

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
  const onLogin = props.onLogin

  const analytics = useIrlAnalytics();

  const onchangeSelectionStatus = (uid: string) => {
    setSelectedGuests((prevSelectedIds: string[]) => {
      if (prevSelectedIds.includes(uid)) {
        return prevSelectedIds.filter((item: string) => item !== uid);
      } else {
        return [...prevSelectedIds, uid];
      }
    });
  };

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
                />
              </div>
            );
          })}
        {filteredList.length === 0 && <div className="guestList__empty">No results found</div>}
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
            width: 896px;
            justify-content: center;
            // border-bottom: 1px solid #cbd5e1;
            padding-top: 20px;
            padding-bottom: 20px;
            font-size: 14px;
            font-weight: 500;
            color: #64748b;
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
