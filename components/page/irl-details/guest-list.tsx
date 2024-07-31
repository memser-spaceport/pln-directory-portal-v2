import { IUserInfo } from '@/types/shared.types';
import GuestTableRow from './guest-table-row';
import { IGuest } from '@/types/irl.types';
import { useEffect } from 'react';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getAnalyticsEventInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';

interface IGuestList {
  userInfo: IUserInfo;
  eventDetails: any;
  showTelegram: boolean;
  items: IGuest[];
  selectedGuests: string[];
  setSelectedGuests: any;
}

const GuestList = (props: IGuestList) => {
  const userInfo = props?.userInfo;
  const eventDetails = props?.eventDetails;
  const isExclusionEvent = eventDetails?.isExclusionEvent;
  const showTelegram = props?.showTelegram;
  const filteredList = props?.items;
  const selectedGuests = props?.selectedGuests;
  const setSelectedGuests = props?.setSelectedGuests;

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
      analytics.floatingBarOpenClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), selectedGuests });
    }
  }, [selectedGuests]);

  return (
    <>
      <div className="guestList">
        {filteredList?.length > 0 &&
          filteredList?.map((guest: IGuest, index: number) => {
            return (
              <div className={`${filteredList.length - 1 !== index ? 'divider' : ''}`} key={`guest-${index}`}>
                <GuestTableRow
                  eventDetails={eventDetails}
                  guest={guest}
                  userInfo={userInfo}
                  isExclusionEvent={isExclusionEvent}
                  showTelegram={showTelegram}
                  selectedGuests={selectedGuests}
                  onchangeSelectionStatus={onchangeSelectionStatus}
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
          }

          .guestList__empty {
            display: flex;
            width: 896px;
            justify-content: center;
            border-bottom: 1px solid #cbd5e1;
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
