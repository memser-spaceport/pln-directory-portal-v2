import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { useState, useEffect, useRef } from 'react';
import {
  ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS,
  EVENTS,
  EVENTS_SUBMIT_FORM_TYPES,
  IAM_GOING_POPUP_MODES,
} from '@/utils/constants';
import AllFollowers from './all-followers';
import Image from 'next/image';
import FollowButton from './follow-button';
import { useSearchParams } from 'next/navigation';
import useClickedOutside from '@/hooks/useClickedOutside';
import { canUserPerformEditAction, filterUpcomingGatherings } from '@/utils/irl.utils';
import PresenceRequestSuccess from './presence-request-success';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { getAccessLevel } from '@/utils/auth.utils';
import Link from 'next/link';
interface IFollowSectionProps {
  userInfo: any;
  eventLocationSummary: any;
  searchParams: any;
  followers: any;
  eventDetails: any;
  locationEvents: any;
  onLogin: any;
  isLoggedIn: any;
  isAdminInAllEvents: any;
  guestDetails: any;
  topicsAndReason: any;
}

const FollowSection = (props: IFollowSectionProps) => {
  const userInfo = props?.userInfo;
  const eventLocationSummary = props?.eventLocationSummary;
  const location = props?.eventLocationSummary;
  const searchParams = props?.searchParams;
  const analytics = useIrlAnalytics();
  const [followProperties, setFollowProperties] = useState<any>({ followers: [], isFollowing: false });
  const guestDetails = props?.guestDetails;
  const updatedUser = guestDetails?.currentGuest ?? null;
  const isUserGoing = guestDetails?.isUserGoing;
  const [isEdit, seIsEdit] = useState(false);
  const [isAddMemberDropdownOpen, setIsAddMemberDropdownOpen] = useState(false);
  const type = searchParams?.type;
  const editResponseRef = useRef<HTMLButtonElement>(null);
  const addMemberRef = useRef<HTMLButtonElement>(null);
  const locationEvents = props?.locationEvents;
  const pastEvents = locationEvents?.pastEvents;
  const upcomingEvents = locationEvents?.upcomingEvents;
  const totalEvents = (upcomingEvents?.length || 0) + (pastEvents?.length || 0);
  const filteredGatherings = upcomingEvents.filter((gathering: any) => filterUpcomingGatherings(gathering));
  // Check if user has any upcoming events (events they can edit)
  const userHasUpcomingEvents = updatedUser?.events?.some((event: any) => filterUpcomingGatherings(event)) ?? false;
  const inPastEvents = type === 'past' || 
    (pastEvents?.length > 0 && upcomingEvents?.length === 0);
  const inPastEventsAndHaveEvents = inPastEvents && pastEvents?.length > 0;
  const onLogin = props.onLogin;
  const isUserLoggedIn = props?.isLoggedIn;
  const isAdminInAllEvents = props?.isAdminInAllEvents;
  const roles = userInfo?.roles ?? [];
  const canUserAddAttendees =
    isAdminInAllEvents && canUserPerformEditAction(roles as string[], ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS);
  const topicsAndReason = props?.topicsAndReason;
  const accessLevel = getAccessLevel(userInfo, isUserLoggedIn);
  const scheduleURL = locationEvents?.additionalInfo?.schedule_url || 
    `${process.env.SCHEDULE_BASE_URL}/program?location=${encodeURIComponent(eventLocationSummary.name)}`;

  // Helper functions
  const getFollowProperties = (followers: any[]) => ({
    followers: followers ?? [],
    isFollowing: followers?.some((follower) => follower.memberUid === userInfo?.uid) ?? false,
  });


  const getFollowerCountText = () => {
    const count = followProperties.followers.length;
    return `${count} ${count > 1 ? 'members' : 'member'}`;
  };

  useEffect(() => {
    setFollowProperties((e: any) => getFollowProperties(props.followers));
  }, [eventLocationSummary.uid, props.followers]);

  useEffect(() => {
    function updateFollowers(e: any) {
      setFollowProperties(getFollowProperties(e.detail));
    }
    document.addEventListener(EVENTS.UPDATE_IRL_LOCATION_FOLLOWERS, updateFollowers);
    return function () {
      document.removeEventListener(EVENTS.UPDATE_IRL_LOCATION_FOLLOWERS, updateFollowers);
    };
  }, []);

  const onFollowersCloseClicHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.IRL_ALL_FOLLOWERS_OPEN_AND_CLOSE, { detail: { status: false } }));
  };

  const onFollowerClickHandler = () => {
    analytics.irlFollowerBtnClicked({});
  };

  const onFollowersClickHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.IRL_ALL_FOLLOWERS_OPEN_AND_CLOSE, { detail: { status: true } }));
    const filteredFollowers = followProperties.followers?.map((follower: any) => follower.memberUid);
    analytics.irlAllFollowersBtnClicked({ followers: filteredFollowers });
  };

  const onAddMemberClick = () => {
    if (upcomingEvents?.length === 0) {
    analytics.trackGuestListAddNewMemberBtnClicked({
      ...location,
      option: 'past_attendees',
      action: 'add_to_past_attendees'
    });
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, {
        detail: { isOpen: true, formdata: null, mode: IAM_GOING_POPUP_MODES.ADMINADD, from: 'past' },
      }),
    );
  setIsAddMemberDropdownOpen(false);
  }
  else if (pastEvents?.length === 0) {
    analytics.trackGuestListAddNewMemberBtnClicked({
      ...location,
      option: 'upcoming_attendees',
      action: 'add_to_upcoming_attendees'
    });
        document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, {
        detail: { isOpen: true, formdata: null, mode: IAM_GOING_POPUP_MODES.ADMINADD, from: 'upcoming' },
      }),
    );
  setIsAddMemberDropdownOpen(false);
  }
  else {
    const isOpening = !isAddMemberDropdownOpen;
    setIsAddMemberDropdownOpen((prev) => !prev);
    
    if (isOpening) {
      analytics.trackGuestListAddNewMemberBtnClicked({
        ...location,
        action: 'dropdown_opened'
      });
    }
  }
};

  const onHandleAttendeesClick = (from: string) => {
    if (from === 'upcoming') {
      analytics.trackGuestListAddNewMemberBtnClicked({
        ...location,
        option: 'current_attendees',
        action: 'add_to_current_attendees'
      });
    } else if (from === 'past') {
      analytics.trackGuestListAddNewMemberBtnClicked({
        ...location,
        option: 'past_attendees',
        action: 'add_to_past_attendees'
      });
    }
    
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, {
        detail: { isOpen: true, formdata: null, mode: IAM_GOING_POPUP_MODES.ADMINADD, from: from },
      }),
    );
    setIsAddMemberDropdownOpen(false);
  };

  const onIAmGoingClick = (from?: string) => {
    let formData: any = { member: userInfo };
    if (typeof topicsAndReason === 'object' && topicsAndReason !== null) {
      formData['topicsAndReason'] = topicsAndReason;
    }

    let props: any = { detail: { isOpen: true, formdata: { ...formData }, mode: IAM_GOING_POPUP_MODES.ADD } };
    if (from === 'mark-presence') {
      props['detail']['from'] = EVENTS_SUBMIT_FORM_TYPES.MARK_PRESENCE;
    }
    document.dispatchEvent(new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, props));
    analytics.trackImGoingBtnClick(location);
  };

  const onLoginClick = () => {
    analytics.trackLoginToRespondBtnClick(location);
    onLogin();
  };

  const onEditResponseClick = () => {
    seIsEdit((prev) => !prev);
  };

  const onRemoveFromGatherings = () => {
    analytics.trackSelfRemoveAttendeePopupOpen(location);
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_REMOVE_GUESTS_POPUP, {
        detail: {
          isOpen: true,
          type: 'self-delete',
        },
      }),
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
      additionalInfo: {
        checkInDate: updatedUser?.additionalInfo?.checkInDate || '',
        checkOutDate: updatedUser?.additionalInfo?.checkOutDate ?? '',
      },
      topics: updatedUser?.topics,
      reason: updatedUser?.reason,
      topicsAndReason: topicsAndReason,
      telegramId: updatedUser?.telegramId,
      officeHours: updatedUser?.officeHours ?? '',
    };
    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, {
        detail: { isOpen: true, formdata: formData, mode: IAM_GOING_POPUP_MODES.EDIT },
      }),
    );
  };

  useClickedOutside({
    ref: editResponseRef,
    callback: () => {
      seIsEdit(false);
    },
  });

  useClickedOutside({
    ref: addMemberRef,
    callback: () => {
      setIsAddMemberDropdownOpen(false);
    },
  });

  const [isShrunk, setIsShrunk] = useState(false);

  useEffect(() => {
    const element = document.getElementById('actionCn');

    if (!element) return;

    // Set the initial rootMargin
    let observer = new IntersectionObserver(
      ([entry]) => {
        setIsShrunk(entry.isIntersecting);
      },
      {
        root: null, // Default is the viewport
        threshold: 0, // Trigger as soon as the element exits the viewport
        rootMargin: '-247px 0px 0px 0px',
      },
    );

    observer.observe(element);
  }, []);

  return (
    <>
      <AllFollowers
        location={eventLocationSummary.name}
        onClose={onFollowersCloseClicHandler}
        followersList={followProperties.followers}
        onFollowerClickHandler={onFollowerClickHandler}
      />
      <div className={`root__irl__follwcnt ${isShrunk ? 'showCntr' : ''}`} id="actionCn">
        <div className={`root__irl__follwcnt__cnt ${!isShrunk ? 'hideCnt' : 'showCnt'}`}>
          <div className={`root__irl__follwcnt__imgsec ${!isShrunk ? 'hideCnt-mob' : 'showCnt'}`}>
            <div onClick={onFollowersClickHandler} className="root__irl__follwcnt__imgsec__images">
              {followProperties.followers?.slice(0, 3).map((follower: any, index: number) => {
                const defaultAvatar = getDefaultAvatar(follower.name);

                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Image
                    key={index}
                    style={{ position: 'relative', zIndex: `${3 - index}`, marginLeft: `-11px` }}
                    className="root__irl__follwcnt__imgsec__images__img"
                    src={follower?.logo || defaultAvatar}
                    alt="follower"
                    height={24}
                    width={24}
                  />
                );
              })}
            </div>
            <div className="root__irl__follwcnt__imgsec__desccnt">
              <span className="root__irl__follwcnt__imgsec__desccnt__desc__cnt" onClick={onFollowersClickHandler}>
                {getFollowerCountText()}{' '}
              </span>
              following gatherings
              <span className="root__irl__follwcnt__imgsec__desccnt__desc__cnt__location">
                at
                <img
                  src={eventLocationSummary?.flag || '/images/irl/defaultFlag.svg'}
                  alt="flag"
                  style={{ width: '17px', height: '17px' }}
                />{' '}
                <span style={{ textTransform: 'capitalize' }}>{eventLocationSummary.name}{' '}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="toolbar__actionCn">
          <Link 
            href={scheduleURL} 
            target="_blank" 
            className="toolbar__actionCn__scheduleBtn"
            onClick={() => analytics.trackViewScheduleClick(location)}
          >
            <img className="toolbar__actionCn__scheduleBtn__calendarIcon" src="/icons/calendar.svg" width={18} height={18} alt="schedule" />
            Schedule
            {totalEvents > 0 && <span className="toolbar__actionCn__scheduleBtn__scheduleText">({totalEvents > 1 ? `${totalEvents} events` : `${totalEvents} event`})</span>}
            <img className="toolbar__actionCn__scheduleBtn__arrowIcon" src="/icons/arrow-blue.svg" alt="arrow icon" width={10} height={10} />
          </Link>

          <div className="toolbar__actionCn__buttons">
            <FollowButton
              eventLocationSummary={location}
              userInfo={userInfo}
              followProperties={followProperties}
              expand={true}
            />
            {canUserAddAttendees && accessLevel === 'advanced' && (
              <div className="toolbar__actionCn__add">
                <div className="toolbar__actionCn__add__wrpr">
                  <button ref={addMemberRef} className="toolbar__actionCn__add__btn" onClick={onAddMemberClick}>
                    <img src="/icons/add.svg" width={16} height={16} alt="add" />
                    <span className="toolbar__actionCn__add__btn__txt">Member</span>
                  </button>
                  {isAddMemberDropdownOpen && (
                    <div className="toolbar__actionCn__add__list">
                      <button className="toolbar__actionCn__add__list__item" onClick={()=> onHandleAttendeesClick("upcoming")}>
                        Add to Current Attendees
                      </button>
                      <button className="toolbar__actionCn__add__list__item" onClick={()=> onHandleAttendeesClick("past")}>
                        Add to Past Attendees
                      </button>
                    </div>
                 )}
                </div>
              </div>
            )}
            {isUserLoggedIn && !canUserAddAttendees && type === 'past' && !isUserGoing && accessLevel === 'advanced' && (
              <button onClick={() => onIAmGoingClick('mark-presence')} className="toolbar__actionCn__imGoingBtn">
                Claim Attendance
              </button>
            )}
            {((isUserLoggedIn && !inPastEvents && accessLevel === 'advanced') && (!isUserGoing || (isUserGoing && filteredGatherings?.length > 0)) && !userHasUpcomingEvents && filteredGatherings?.length > 0) && (
              <button onClick={() => onIAmGoingClick('upcoming')} className="toolbar__actionCn__imGoingBtn">
                I&apos;m Going
              </button>
            )} 
            {!isUserLoggedIn && (
              <button onClick={onLoginClick} className="toolbar__actionCn__login">
                Login to Respond
              </button>
            )} 
            {isUserGoing && isUserLoggedIn && (!inPastEvents || (inPastEvents && inPastEventsAndHaveEvents)) && accessLevel === 'advanced' && userHasUpcomingEvents &&
               (
                <div className="toolbar__actionCn__edit__wrpr">
                  <button ref={editResponseRef} onClick={onEditResponseClick} className="toolbar__actionCn__edit">
                    <img src="/icons/edit-white.svg" alt="arrow" width={18} height={18} />
                    Response
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
          </div>
        </div>
      <PresenceRequestSuccess />
      <style jsx>
        {`
          .root__irl__follwcnt {
            display: flex;
            padding: 10px;
            transition: all 0.3s ease-in-out;
            padding-top: ${!isShrunk ? '10px' : ''};
            padding-bottom: ${!isShrunk ? '10px' : ''};
            width: 100%;
            flex-direction: column;
            justify-content: space-between;
            align-items: flex-start;
            gap: ${!isShrunk ? '0' : '16px'};
          }

          .root__irl__follwcnt__cnt {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }

          .root__irl__follwcnt__imgsec {
            display: flex;
            gap: 8px;
            align-items: center;
            padding-left: 12px;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            letter-spacing: 0.01em;
            text-align: left;
            opacity: 1;
            transition: opacity 0.4s ease;
          }

          .hideCnt,
          .hideCnt-mob {
            opacity: 0;
            visibility: hidden !important;
            height: 0px;
            transition:
              height 0.3s ease-in-out,
              padding 0.3s ease,
              opacity 0.3s ease-in-out;
          }

          .showCnt {
            opacity: 1;
            transition:
              opacity 0.4s ease-in-out,
              height 0.6s ease-in-out,
              padding 0.6s ease-in-out;
          }

          .root__irl__follwcnt__imgsec__images {
            display: flex;
            justify-content: end;
            cursor: pointer;
            min-height: ${followProperties?.followers?.length > 0 ? '25px' : ''};
          }

          .root__irl__follwcnt__imgsec__desccnt__desc {
            display: flex;
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            gap: 4px;
          }

          .root__irl__follwcnt__imgsec__desccnt__desc__cnt {
            color: #156ff7;
            cursor: pointer;
          }

          .root__irl__follwcnt__imgsec__desccnt__desc__cnt__location {
            display: flex;
            align-items: center;
            gap: 4px;
          }



          .toolbar__actionCn {
            display: flex;
            gap: 8px;
            width: 100%;
            flex-wrap: wrap;
          }

          .toolbar__actionCn__buttons {
            display: flex;
            gap: 8px;
            width: 100%;
          }

          .toolbar__actionCn__add {
            display: flex;
            align-items: center;
            width: 100%;
          }
          .toolbar__actionCn__add__wrpr {
            position: relative;
            width: 100%;
          }
          .toolbar__actionCn__add__btn {
            display: flex;
            align-items: center;
            gap: 4px;
            background: #fff;
            border: 1px solid #cbd5e1;
            height: 40px;
            padding: 10px 8px;
            border-radius: 8px;
            justify-content: center;
            width: 100%;
          }
          .toolbar__actionCn__add__list {
            position: absolute;
            z-index: 4;
            width: 207px;
            background: #fff;
            padding: 8px;
            border-radius: 8px;
            box-shadow: 0px 2px 6px 0px #0f172a29;
            margin-top: 4px;
            left: 0;
          }
          .toolbar__actionCn__add__list__item {
            font-size: 14px;
            line-height: 28px;
            text-align: left;
            color: #0F172A;
            cursor: pointer;
            padding: 4px 8px;
            white-space: nowrap;
            width: 100%;
            background: inherit;
          }
          .toolbar__actionCn__add__list__item:hover {
            background-color: #f1f5f9;
            border-radius: 8px;
            transition: all 0.2s ease;
          }
          .toolbar__actionCn__add__btn__txt {
            font-size: 14px;
            font-weight: 500;
            line-height: 24px;
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
            white-space: nowrap;
            width: 100%;
            padding: 10px 12px;
          }
          .toolbar__actionCn__imGoingBtn:hover {
            background: #1d4ed8;
          }
          .toolbar__actionCn__edit__wrpr {
            position: relative;
            width: 100%;
          }
          .toolbar__actionCn__edit {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            padding: 10px 8px;
            font-size: 14px;
            font-weight: 500;
            height: 40px;
            cursor: pointer;
            background: #156ff7;
            color: #fff;
            width: 100%;
            white-space: nowrap;
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
            width: 100%;
            background: inherit;
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
            width: 100%;
            color: #fff;
            white-space: nowrap;
          }

          .root__irl__follwcnt__imgsec__desccnt {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            align-items: center;
          }


            .root__irl__mobileView {
              display: flex;
              width: 90vw;
              max-height: 70vh;
              overflow-y: auto;
            }

            .toolbar {
              flex-direction: row;
              flex-wrap: wrap;
            }
            .toolbar__hdr {
              flex: 1;
              align-items: center;
            }
            .toolbar__search {
              flex-basis: 100%;
            }
            .toolbar__actionCn__edit__list {
              right: 0px;
              left: unset;
            }
            .toolbar__actionCn__add__list {
              left: 0px;
              right: unset;
            }

            .toolbar__actionCn__webView,
            .toolbar__actionCn__webView__follCnt {
              display: none;
            }

          @media (min-width: 768px) {
            .root__irl__follwcnt {
              width: 100%;
            }


            .root__irl__follwcnt__imgsec {
              display: flex;
            }

            .hideCnt {
              opacity: 1;
              visibility: visible !important;
              height: 100%;
              transition:
                opacity 0.8s ease-in-out,
                height 0.8s ease-in-out 0.2s,
                padding 0.8s ease-in-out 1s;
            }

            .root__irl__follwcnt__cnt {
              margin-top: ${!isShrunk ? '15px' : ''};
            }

            .toolbar__actionCn__edit {
              padding: 10px 12px;
            }
          }

          @media (min-width: 1024px) {
            .root__irl__follwcnt {
              width: 100%;
              flex-direction: row;
              align-items: center;
              gap: 10px !important;
            }

            .hideCnt-mob {
              opacity: 1;
              visibility: visible !important;
              height: 100%;
              transition:
                opacity 0.6s ease-in-out,
                height 0.8s ease-in-out 0.2s,
                padding 0.8s ease-in-out 0.2s;
            }

            .root__irl__follwcnt__cnt {
              margin-top: unset;
            }

            .root__irl__mobileView {
              display: flex;
              width: 90vw;
              max-height: 70vh;
              overflow-y: auto;
            }

            .toolbar__actionCn__webView,
            .toolbar__actionCn__webView__follCnt {
              display: flex;
            }

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
            .toolbar__hdr__count {
              min-width: 140px;
            }
            .toolbar__actionCn {
              flex-direction: row;
              flex: 1;
              justify-content: flex-end;
              flex-wrap: unset;
            }
            .toolbar__actionCn__login {
              width: fit-content;
            }

            .toolbar__actionCn__add {
              width: 104px;
            }

            .toolbar__actionCn__buttons {
               justify-content: flex-end;
               width: fit-content;
            }

          }
        `}
      </style>

      <style jsx global>{`
        .toolbar__actionCn__scheduleBtn {
          display: ${isShrunk ? 'flex' : 'none'};
          align-items: center;
          justify-content: center;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          height: 40px;
          padding: 10px 12px;
          font-weight: 400;
          font-size: 14px;
          line-height: 20px;
          letter-spacing: 0px;
          border-radius: 8px;
          cursor: pointer;
          color: #0F172A;
          text-decoration: none;
          box-shadow: 0px 1px 1px 0px #0F172A14;
          width: 100%;
        }

        .toolbar__actionCn__scheduleBtn__arrowIcon {
          margin-left: 5px;
        }

        .toolbar__actionCn__scheduleBtn__calendarIcon {
          margin-right: 8px;
        }

        .toolbar__actionCn__scheduleBtn__scheduleText {
          font-size: 12px;
          font-weight: 400;
          line-height: 18px;
          color: #475569;
          margin-left: 5px;
          white-space: nowrap;
          display: flex;
          align-items: center;
          margin-top: 2px;
        }

        @media (min-width: 1024px) {
          .toolbar__actionCn__scheduleBtn {
            display: flex;
            max-width: 210px;
            align-items: center;
          }
        }
      `}</style>
    </>
  );
};

export default FollowSection;
