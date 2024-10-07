import { useEffect, useState } from 'react';

import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { canUserPerformEditAction, isPastDate } from '@/utils/irl.utils';
import { ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS, EVENT_TYPE, EVENTS, IAM_GOING_POPUP_MODES } from '@/utils/constants';
import { IUserInfo } from '@/types/shared.types';
import Search from './search';
import { useSearchParams } from 'next/navigation';
import AttendeeForm from '../add-edit-attendee/attendee-form';

interface IToolbar {
  onLogin: () => void;
  userInfo: IUserInfo;
  isUserGoing: boolean;
  // filteredList: IGuest[];
  isUserLoggedIn: boolean;
  eventDetails: any;
}

const Toolbar = (props: any) => {
  //props
  const onLogin = props.onLogin;
  const userInfo = props?.userInfo;
  const location = props?.location;
  const isUserLoggedIn = props?.isLoggedIn;
  const isUserGoing = props?.isUserGoing;
  const filteredListLength = props?.filteredListLength ?? 0;
  const roles = userInfo?.roles ?? [];
  const eventDetails = props?.eventDetails;
  const defaultTopics = process.env.IRL_DEFAULT_TOPICS?.split(',') ?? [];
  const updatedUser = props?.updatedUser;

  //states
  const [searchTerm, setSearchTerm] = useState('');
  const [iamGoingPopupProps, setIamGoingPopupProps] = useState({ isOpen: false, formdata: null, mode: '' });
  const [isEdit, seIsEdit] = useState(false);
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  //hooks
  const analytics = useIrlAnalytics();
  const canUserAddAttendees = canUserPerformEditAction(roles as string[], ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS);

  const onEditResponseClick = () => {
    // setIamGoingPopupProps({isOpen: true, formdata: updatedUser, mode: IAM_GOING_POPUP_MODES.EDIT});
    seIsEdit((prev) => !prev);
  };

  // Open Attendee Details Popup to add guest
  const onIAmGoingClick = () => {
    setIamGoingPopupProps({ isOpen: true, formdata: null, mode: IAM_GOING_POPUP_MODES.ADD });
    analytics.trackImGoingBtnClick(location);
    document.dispatchEvent(
      new CustomEvent('openRsvpModal', {
        detail: {
          isOpen: true,
          type: 'add',
        },
      })
    );
  };

  const onIamGoingPopupClose = () => {
    setIamGoingPopupProps({ isOpen: false, formdata: null, mode: '' });
  };

  // Open Attendee Details Popup to edit the guest
  const onEditResponse = () => {
    analytics.trackEditResponseBtnClick(location);
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
    analytics.trackLoginToRespondBtnClick(location);
    onLogin();
  };

  // Open Attendee Details Popup to add the guest by admin
  const onAddMemberClick = () => {
    analytics.trackGuestListAddNewMemberBtnClicked(location);
    setIamGoingPopupProps({ isOpen: true, formdata: null, mode: IAM_GOING_POPUP_MODES.ADMINADD });
  };

  const onRemoveFromGatherings = () => {
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_REMOVE_GUESTS_POPUP, {
        detail: {
          isOpen: true,
          type: 'self-delete',
        },
      })
    );
  };

  useEffect(() => {
    if (searchTerm) {
      const handler = setTimeout(() => {
        analytics.trackGuestListSearch(location, searchTerm);
      }, 500);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [searchTerm]);

  return (
    <>
      {iamGoingPopupProps?.isOpen && (
        <AttendeeForm
          onClose={onIamGoingPopupClose}
          formdata={iamGoingPopupProps?.formdata}
          selectedLocation={location}
          userInfo={userInfo}
          allGatherings={eventDetails?.events}
          defaultTags={defaultTopics}
          mode={iamGoingPopupProps?.mode}
          allGuests={eventDetails?.guests}
        />
      )}
      <div className="toolbar">
        <span className="toolbar__hdr">
          <span className="toolbar__hdr__count">
            Attendees{` `}({filteredListLength})
          </span>
        </span>
        <div className="toolbar__actionCn">
          {/* {isUserLoggedIn && (
            <>
              <button className="toolbar__actionCn__download__btn" onClick={onAddMemberClick}>
                <img src="/icons/download.svg" width={16} height={16} alt="add" />
                <span className="toolbar__actionCn__download__btn__txt">Attendee List</span>
              </button>
              <button className="toolbar__actionCn__download__btn-mob" onClick={onAddMemberClick}>
                <img src="/icons/download.svg" width={16} height={16} alt="add" />
              </button>
            </>
          )} */}
          {canUserAddAttendees && (
            <div className="toolbar__actionCn__add">
              <button className="toolbar__actionCn__add__btn" onClick={onAddMemberClick}>
                <img src="/icons/add.svg" width={16} height={16} alt="add" />
                <span className="toolbar__actionCn__add__btn__txt">New Member</span>
              </button>
            </div>
          )}

          {!isUserGoing && isUserLoggedIn && type !== 'past' && (
            <button onClick={onIAmGoingClick} className="mb-btn toolbar__actionCn__imGoingBtn">
              I am Going
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

          {isUserGoing && isUserLoggedIn && type !== 'past' && (
            <div className="toolbar__actionCn__edit__wrpr">
              <button onClick={onEditResponseClick} className="toolbar__actionCn__edit">
                Edit Response
                <img src="/icons/down-arrow-white.svg" alt="arrow" width={18} height={18} />
              </button>
              {isEdit && (
                <div className="toolbar__actionCn__edit__list">
                  <div className="toolbar__actionCn__edit__list__item">Edit Details</div>
                  <div onClick={onRemoveFromGatherings} className="toolbar__actionCn__edit__list__item">
                    Remove from gathering(s)
                  </div>
                </div>
              )}
            </div>
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
            width: 132px;
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
            right: 0;
          }

          .toolbar__actionCn__edit__list__item {
            font-size: 14px;
            font-weight: 500;
            line-height: 28px;
            text-align: left;
            color: #0f172a;
            cursor: pointer;
            padding: 4px 8px;
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
            }

            .toolbar__search {
              flex-basis: 100%;
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
              width: 300px;
              margin-left: 16px;
              order: 1;
              flex-basis: unset;
            }

            .toolbar__hdr {
              font-size: 20px;
              flex: unset;
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
              width: 86px;
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
