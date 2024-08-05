import { ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS, EVENT_TYPE } from '@/utils/constants';
import { canUserPerformAction, isPastDate } from '@/utils/irl.utils';
import { useEffect, useRef, useState } from 'react';
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
  //props
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
  const role = userInfo?.roles ?? [];

  //states
  const [searchTerm, setSearchTerm] = useState('');

  //hooks
  const analytics = useIrlAnalytics();
  const canUserAddAttendees = canUserPerformAction(userInfo.roles as string[], ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS);

  // Open Attendee Details Popup to add guest
  const onIAmGoingClick = () => {
    analytics.guestListImGoingClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), type: 'i am going' });

    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
          type: 'add',
        },
      })
    );
  };

  // Open Attendee Details Popup to edit the guest
  const onEditResponse = () => {
    analytics.guestListEditResponseClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails), type: 'edit response' });
    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
          type: 'self-edit',
          selectedGuest: userInfo?.uid,
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

  // Open Attendee Details Popup to add the guest by admin
  const onAddMemberClick = () => {
    analytics.addNewMemberBtnClicked(getAnalyticsUserInfo(userInfo), { ...getAnalyticsEventInfo(eventDetails) });
    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
          isAllowedToManageGuests: true,
        },
      })
    );
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
          {canUserAddAttendees && (
            <div className="toolbar__actionCn__add">
              <button className="toolbar__actionCn__add__btn" onClick={onAddMemberClick}>
                <img src="/icons/add-user-blue.svg" width={16} height={16} alt="add" />
                <span className="toolbar__actionCn__add__btn__txt">Add Member</span>
              </button>

              <button className="toolbar__actionCn__add__btn-mob" onClick={onAddMemberClick}>
                <img src="/icons/add-user-blue.svg" width={16} height={16} alt="add" />
                <span className="toolbar__actionCn__add__btn__txt-mob">Add</span>
              </button>
            </div>
          )}
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
            order: 1;
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
            order: 2;
          }

          .toolbar__actionCn__add {
            display: flex;
            align-items: center;
          }

          .toolbar__actionCn__add__btn {
            display: none;
          }

          .toolbar__actionCn__add__btn__txt {
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
            color: #0F172A;
            font-style: normal;
          }

          .toolbar__actionCn__add__btn-mob {
            height: 40px;
            padding: 10px;
            display: flex;
            align-items: center;
            gap: 4px;
            background: #fff;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
          }

          .toolbar__actionCn__add__btn__txt-mob {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            color: #0f172a;
          }

          .toolbar__actionCn__schduleBtn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
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
            padding: 10px 12px;
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
            padding: 10px 12px;
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
              order: 1;
            }

            .toolbar__hdr {
              font-size: 20px;
            }

            .toolbar__actionCn {
              flex: 1;
              order: 2;
            }

            .toolbar__actionCn__schduleBtn {
              width: unset;
            }

            .toolbar__actionCn__login {
              width: fit-content;
            }

            .toolbar__actionCn__add__btn {
              display: flex;
              align-items: center;
              gap: 4px;
              background: transparent;
              border: 1px solid #cbd5e1;
              background: #fff;
              height: 40px;
              padding: 10px 12px;
              border-radius: 8px;
            }

            .toolbar__actionCn__add__btn-mob {
              display: none;
            }
          }
        `}
      </style>
    </>
  );
};

export default Toolbar;
