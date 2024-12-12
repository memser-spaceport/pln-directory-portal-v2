import { useEffect, useRef, useState } from 'react';

import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { canUserPerformEditAction } from '@/utils/irl.utils';
import { ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS, EVENTS, IAM_GOING_POPUP_MODES } from '@/utils/constants';
import { IUserInfo } from '@/types/shared.types';
import { useRouter, useSearchParams } from 'next/navigation';
import useClickedOutside from '@/hooks/useClickedOutside';
import { IAnalyticsGuestLocation, IGuestDetails } from '@/types/irl.types';
import Search from './search';
import { triggerLoader } from '@/utils/common.utils';

interface IToolbar {
  onLogin: () => void;
  userInfo: IUserInfo;
  filteredListLength: number;
  isLoggedIn: boolean;
  eventDetails: IGuestDetails;
  location: IAnalyticsGuestLocation;
  isAdminInAllEvents: any;
  locationEvents: any;
}

const Toolbar = (props: IToolbar) => {
  //props
  const onLogin = props.onLogin;
  const userInfo = props?.userInfo;
  const location = props?.location;
  const isUserLoggedIn = props?.isLoggedIn;
  const filteredListLength = props?.filteredListLength ?? 0;
  const roles = userInfo?.roles ?? [];
  const eventDetails = props?.eventDetails;
  const updatedUser = eventDetails?.currentGuest ?? null;
  const isUserGoing = eventDetails?.isUserGoing;
  const isAdminInAllEvents = props?.isAdminInAllEvents;
  const locationEvents = props?.locationEvents;
  const pastEvents = locationEvents?.pastEvents;
  const upcomingEvents = locationEvents?.upcomingEvents;

  //states
  // const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const [isEdit, seIsEdit] = useState(false);
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const editResponseRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const inPastEvents = type ? type === 'past' : (pastEvents && pastEvents.length > 0 && upcomingEvents && upcomingEvents.length === 0);

  useClickedOutside({
    ref: editResponseRef,
    callback: () => {
      seIsEdit(false);
    },
  });

  //hooks
  const analytics = useIrlAnalytics();
  const canUserAddAttendees = isAdminInAllEvents && canUserPerformEditAction(roles as string[], ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS);

  const onEditResponseClick = () => {
    // setIamGoingPopupProps({isOpen: true, formdata: updatedUser, mode: IAM_GOING_POPUP_MODES.EDIT});
    seIsEdit((prev) => !prev);
  };

  // Open Attendee Details Popup to add guest
  const onIAmGoingClick = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, { detail: { isOpen: true, formdata: { member: userInfo }, mode: IAM_GOING_POPUP_MODES.ADD } }));
    analytics.trackImGoingBtnClick(location);
  };

  const onIamGoingPopupClose = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, { detail: { isOpen: false, formdata: null, mode: '' } }));
  };

  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const updateQueryParams = debounce((value: string) => {
    triggerLoader(true);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
    analytics.trackGuestListSearch(location, value);
  }, 300);

  const getValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event?.target?.value;
    updateQueryParams(searchValue?.trim());
  };

  const onLoginClick = () => {
    analytics.trackLoginToRespondBtnClick(location);
    onLogin();
  };

  // Open Attendee Details Popup to add the guest by admin
  const onAddMemberClick = () => {
    analytics.trackGuestListAddNewMemberBtnClicked(location);
    document.dispatchEvent(new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, { detail: { isOpen: true, formdata: null, mode: IAM_GOING_POPUP_MODES.ADMINADD } }));
  };

  const onRemoveFromGatherings = () => {
    analytics.trackSelfRemoveAttendeePopupOpen(location);
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_REMOVE_GUESTS_POPUP, {
        detail: {
          isOpen: true,
          type: 'self-delete',
        },
      })
    );
  };

  const onEditDetailsClicked = () => {
    analytics.trackSelfEditDetailsClicked(location);
    const formData = {
      team: {
        name: updatedUser?.teamName,
        logo: updatedUser?.teamLogo,
        uid: updatedUser?.teamUid,
      },
      member: {
        name: updatedUser?.memberName,
        logo: updatedUser?.memberLogo,
        uid: updatedUser?.memberUid,
      },
      teamUid: updatedUser?.teamUid,
      events: updatedUser?.events,
      teams: updatedUser?.teams?.map((team: any) => {
        return { ...team, uid: team?.id };
      }),
      memberUid: updatedUser?.memberUid,
      additionalInfo: { checkInDate: updatedUser?.additionalInfo?.checkInDate || '', checkOutDate: updatedUser?.additionalInfo?.checkOutDate ?? '' },
      topics: updatedUser?.topics,
      reason: updatedUser?.reason,
      telegramId: updatedUser?.telegramId,
      officeHours: updatedUser?.officeHours ?? '',
    };

    document.dispatchEvent(new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, { detail: { isOpen: true, formdata: formData, mode: IAM_GOING_POPUP_MODES.EDIT } }));
  };

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.value = search ?? '';
    }
  }, [router, searchParams]);

  return (
    <>
      <div className="toolbar">
        <span className="toolbar__hdr">
          <span className="toolbar__hdr__count">
            Attendees{` `}({filteredListLength})
          </span>
        </span>
        <div className="toolbar__actionCn">
          {canUserAddAttendees && (
            <div className="toolbar__actionCn__add">
              <button className="toolbar__actionCn__add__btn" onClick={onAddMemberClick}>
                <img src="/icons/add.svg" width={16} height={16} alt="add" />
                <span className="toolbar__actionCn__add__btn__txt">New People</span>
              </button>
            </div>
          )}

          {!isUserGoing && isUserLoggedIn && !inPastEvents && (
            <button onClick={onIAmGoingClick} className="mb-btn toolbar__actionCn__imGoingBtn">
              I&apos;m Going
            </button>
          )}

          {!isUserLoggedIn && (
            <>
              <button onClick={onLoginClick} className="toolbar__actionCn__login">
                Login to Respond
              </button>
              <button onClick={onLoginClick} className="toolbar__actionCn__login-mob">
                Login to respond & view complete list
              </button>
            </>
          )}

          {isUserGoing && isUserLoggedIn && !inPastEvents && (
            <div className="toolbar__actionCn__edit__wrpr">
              <button ref={editResponseRef} onClick={onEditResponseClick} className="toolbar__actionCn__edit">
                Edit Response
                <img src="/icons/down-arrow-white.svg" alt="arrow" width={18} height={18} />
              </button>
              {isEdit && (
                <div className="toolbar__actionCn__edit__list">
                  <button className="toolbar__actionCn__edit__list__item" onClick={onEditDetailsClicked}>
                    Edit Details
                  </button>
                  <button onClick={onRemoveFromGatherings} className="toolbar__actionCn__edit__list__item">
                    Remove from Gathering(s)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="toolbar__search">
          <Search searchRef={searchRef} onChange={getValue} placeholder="Search by Attendee, Team or Project" />
        </div>
      </div>

      <style jsx>
        {`
          button {
            background: inherit;
            width: 100%;
          }
          .toolbar {
            display: flex;
            flex-direction: column;
            row-gap: 16px;
            padding: 16px 20px;
          }

          .toolbar__search {
            // width: 100%;
          }

          .toolbar__hdr {
            font-size: 18px;
            font-weight: 700;
            display: flex;
          }

          .toolbar__hdr__count {
            font-size: 14px;
            font-weight: 400;
            font-size: 18px;
            font-weight: 700;
            line-height: 20px;
            color: #0f172a;
          }

          .toolbar__actionCn {
            display: flex;
            // justify-content: flex-end;
            gap: 8px;
            width: auto;
          }

          .toolbar__actionCn__add {
            display: flex;
            align-items: center;
          }

          .toolbar__actionCn__download__btn {
            display: none;
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
            justify-content: center;
          }

          .toolbar__actionCn__add__btn__txt {
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
            color: #0f172a;
          }

          .toolbar__actionCn__download__btn__txt {
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
            color: #0f172a;
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

          .toolbar__actionCn__download__btn-mob {
            height: 40px;
            padding: 10px 12px;
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
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            height: 40px;
            cursor: pointer;
            background: #156ff7;
            color: #fff;
            width: 132px;
          }

          .toolbar__actionCn__imGoingBtn:hover {
            background: #1d4ed8;
          }

          .toolbar__actionCn__edit__wrpr {
            position: relative;
          }

          .toolbar__actionCn__edit {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
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

          .toolbar__actionCn__edit__list {
            position: absolute;
            z-index: 4;
            width: 207px;
            background: #fff;
            padding: 8px;
            border-radius: 12px;
            box-shadow: 0px 2px 6px 0px #0f172a29;
            margin-top: 4px;
            left: 0;
          }

          .toolbar__actionCn__edit__list__item {
            font-size: 14px;
            font-weight: 500;
            line-height: 28px;
            text-align: left;
            color: #0f172a;
            cursor: pointer;
            padding: 4px 8px;
            white-space: nowrap;
          }

          .toolbar__actionCn__edit__list__item:hover {
            background-color: #f1f5f9;
            border-radius: 4px;
            transition: all 0.2s ease;
          }

          .toolbar__actionCn__edit:hover {
            background: #1d4ed8;
          }

          .toolbar__actionCn__login {
            display: none;
          }

          .toolbar__actionCn__login-mob {
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
            width: 320px;
            color: #fff;
          }

          @media (min-width: 498px) {
            // .mb-btn {
            //   font-size: 12px;
            // }

            .toolbar {
              flex-direction: row;
              flex-wrap: wrap;
            }

            .toolbar__actionCn,
            .toolbar__hdr {
              flex: 1;
              align-items: center;
            }

            .toolbar__actionCn {
              justify-content: flex-end;
              flex: unset;
            }

            .toolbar__search {
              flex-basis: 100%;
            }

            .toolbar__actionCn__edit__list {
              right: 0px;
              left: unset;
            }
          }

          @media (min-width: 1024px) {
            .toolbar {
              flex-wrap: unset;
              justify-content: unset;
              align-items: center;
              padding: 0px;
            }

            .toolbar__search {
              width: 400px;
              margin-left: 16px;
              order: 1;
              flex-basis: unset;
            }

            .toolbar__hdr {
              font-size: 20px;
              flex: unset;
            }

            .toolbar__hdr__count {
              min-width: 140px;
            }

            .toolbar__actionCn {
              flex: 1;
              justify-content: flex-end;
              order: 2;
            }

            .toolbar__actionCn__schduleBtn {
              width: unset;
            }

            .toolbar__actionCn__imGoingBtn {
              width: 95px;
              padding: 10px 12px;
            }

            .toolbar__actionCn__login {
              width: fit-content;
            }

            .toolbar__actionCn__download__btn {
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

            .toolbar__actionCn__download__btn-mob {
              display: none;
            }

            .toolbar__actionCn__login-mob {
              display: none;
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
          }
        `}
      </style>
    </>
  );
};

export default Toolbar;
