import { EVENT_TYPE } from '@/utils/constants';
import { isPastDate } from '@/utils/irl.utils';
import { useEffect, useState } from 'react';
import Search from './search';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { getAnalyticsEventInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { IUserInfo } from '@/types/shared.types';
import { IGuest } from '@/types/irl.types';

interface IToolbar {
  onLogin: () => void;
  userInfo: IUserInfo;
  isUserGoing: boolean;
  filteredList: IGuest[];
  isUserLoggedIn: boolean;
  eventDetails: any;
}

const Toolbar = (props: IToolbar) => {
  const eventDetails = props?.eventDetails;
  const onLogin = props.onLogin;
  const userInfo = props?.userInfo;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const isUserGoing = props?.isUserGoing;
  const isPastEvent = isPastDate(eventDetails?.endDate);
  const filteredList = props?.filteredList;
  const type = eventDetails?.type;
  const schedule = eventDetails?.additionalInfo?.schedule ?? 'View Schedule';
  const websiteUrl = eventDetails?.websiteUrl;

  const [searchTerm, setSearchTerm] = useState('');
  const analytics = useIrlAnalytics();

  const onIAmGoingClick = () => {
    analytics.guestListImGoingClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), type: 'i am going' });

    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
        },
      })
    );
  };

  const onEditResponse = () => {
    analytics.guestListEditResponseClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), type: 'edit response' });
    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
        },
      })
    );
  };

  const getValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event?.target?.value;
    setSearchTerm(searchValue);
    document.dispatchEvent(
      new CustomEvent('irl-details-searchlist', {
        detail: {
          searchValue: searchValue,
        },
      })
    );
  };

  const onLoginClick = () => {
    analytics.guestListLoginClicked(getAnalyticsEventInfo(eventDetails));
    onLogin();
  };

  const onScheduleClick = () => {
    analytics.guestListViewScheduleClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), schedulePageUrl: eventDetails?.websiteUrl });
  };

  useEffect(() => {
    if (searchTerm) {
      const handler = setTimeout(() => {
        analytics.guestListSearchApplied(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), searchTerm });
      }, 500);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [searchTerm]);

  return (
    <>
      <div className="toolbar">
        <span className="toolbar__hdr">
          Attendees{` `}
          <span className="toolbar__hdr__count">({filteredList.length})</span>
        </span>
        <div className="toolbar__actionCn">
          {websiteUrl && (
            <a target="_blank" rel="noreferrer" href={websiteUrl} className="toolbar__actionCn__schduleBtn" onClick={onScheduleClick}>
              {schedule}
            </a>
          )}
          {type !== EVENT_TYPE.INVITE_ONLY && !isUserGoing && isUserLoggedIn && !isPastEvent && (
            <button onClick={onIAmGoingClick} className="mb-btn toolbar__actionCn__imGoingBtn">
              I am Going
            </button>
          )}
          {!isUserLoggedIn && (
            <button onClick={onLoginClick} className="mb-btn toolbar__actionCn__login">
              {isPastEvent ? 'Login to Access' : 'Login to Respond'}
            </button>
          )}
          {isUserGoing && isUserLoggedIn && !isPastEvent && (
            <button onClick={onEditResponse} className="mb-btn toolbar__actionCn__edit">
              Edit Response
            </button>
          )}
        </div>
        {isUserLoggedIn && (
          <div className="toolbar__search">
            <Search onChange={getValue} placeholder="Search by Attendee, Team or Project" />
          </div>
        )}
      </div>

      <style jsx>
        {`
          .toolbar {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            row-gap: 8px;
          }

          .toolbar__search {
            width: 100%;
          }

          .toolbar__hdr {
            font-size: 18px;
            font-weight: 700;
          }

          .toolbar__hdr__count {
            font-size: 14px;
            font-weight: 400;
          }

          .toolbar__actionCn {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            width: auto;
          }

          .toolbar__actionCn__schduleBtn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            cursor: pointer;
            background: white;
            color: #0f172a;
          }

          .toolbar__actionCn__imGoingBtn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            cursor: pointer;
            background: #156ff7;
            color: #fff;
          }

          .toolbar__actionCn__imGoingBtn:hover {
            background: #1d4ed8;
          }

          .toolbar__actionCn__login {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            cursor: pointer;
            background: #156ff7;
            color: #fff;
          }

          .toolbar__actionCn__login:hover {
            background: #1d4ed8;
          }

          .toolbar__actionCn__edit {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            cursor: pointer;
            background: #156ff7;
            color: #fff;
          }

          .toolbar__actionCn__edit:hover {
            background: #1d4ed8;
          }

          @media (max-width: 375px) {
            .mb-btn {
              font-size: 12px;
            }
          }

          @media (min-width: 1024px) {
            .toolbar {
              flex-wrap: unset;
              justify-content: unset;
              align-items: center;
            }

            .toolbar__search {
              width: 300px;
              margin-left: 16px;
              order: 2;
            }

            .toolbar__hdr {
              font-size: 20px;
            }

            .toolbar__actionCn {
              flex: 1;
              order: 3;
            }

            .toolbar__actionCn__schduleBtn {
              width: unset;
              padding: 0px 24px;
            }

            .toolbar__actionCn__login {
              width: fit-content;
            }
          }
        `}
      </style>
    </>
  );
};

export default Toolbar;
