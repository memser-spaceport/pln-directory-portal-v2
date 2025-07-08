import { useIrlAnalytics } from '@/analytics/irl.analytics';
import { useState, useEffect, useRef } from 'react';
import { ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS, EVENTS, EVENTS_SUBMIT_FORM_TYPES, IAM_GOING_POPUP_MODES } from '@/utils/constants';
import AllFollowers from './all-followers';
import Image from 'next/image';
import FollowButton from './follow-button';
import { useSearchParams } from 'next/navigation';
import useClickedOutside from '@/hooks/useClickedOutside';
import { canUserPerformEditAction } from '@/utils/irl.utils';
import PresenceRequestSuccess from './presence-request-success';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { getAccessLevel } from '@/utils/auth.utils';
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
  const searchParam = useSearchParams();
  const type = searchParam.get('type');
  const editResponseRef = useRef<HTMLButtonElement>(null);
  const locationEvents = props?.locationEvents;
  const pastEvents = locationEvents?.pastEvents;
  const upcomingEvents = locationEvents?.upcomingEvents;
  const inPastEvents = type ? type === 'past' : pastEvents && pastEvents.length > 0 && upcomingEvents && upcomingEvents.length === 0;
  const inPastEventsAndHaveEvents = inPastEvents && pastEvents && pastEvents.length > 0;
  const onLogin = props.onLogin;
  const isUserLoggedIn = props?.isLoggedIn;
  const isAdminInAllEvents = props?.isAdminInAllEvents;
  const roles = userInfo?.roles ?? [];
  const canUserAddAttendees = isAdminInAllEvents && canUserPerformEditAction(roles as string[], ALLOWED_ROLES_TO_MANAGE_IRL_EVENTS);
  const topicsAndReason = props?.topicsAndReason;
  const accessLevel = getAccessLevel(userInfo, isUserLoggedIn);

  function getFollowProperties(followers: any) {
    return {
      followers: followers ?? [],
      isFollowing: followers.some((follower: any) => follower.memberUid === userInfo?.uid),
    };
  }

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
    analytics.trackGuestListAddNewMemberBtnClicked(location);
    document.dispatchEvent(new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, { detail: { isOpen: true, formdata: null, mode: IAM_GOING_POPUP_MODES.ADMINADD } }));
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
      additionalInfo: { checkInDate: updatedUser?.additionalInfo?.checkInDate || '', checkOutDate: updatedUser?.additionalInfo?.checkOutDate ?? '' },
      topics: updatedUser?.topics,
      reason: updatedUser?.reason,
      topicsAndReason: topicsAndReason,
      telegramId: updatedUser?.telegramId,
      officeHours: updatedUser?.officeHours ?? '',
    };
    document.dispatchEvent(new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, { detail: { isOpen: true, formdata: formData, mode: IAM_GOING_POPUP_MODES.EDIT } }));
  };

  useClickedOutside({
    ref: editResponseRef,
    callback: () => {
      seIsEdit(false);
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
      <AllFollowers location={eventLocationSummary.name} onClose={onFollowersCloseClicHandler} followersList={followProperties.followers} onFollowerClickHandler={onFollowerClickHandler} />
      <div className={`root__irl__follwcnt ${isShrunk ? 'showCntr' : ''}`} id="actionCn">
        <div className={`root__irl__follwcnt__cnt ${!isShrunk ? 'hideCnt' : 'showCnt'}`}>
          <div className="root__irl__follcnt__update__web">Planning to attend? Enroll yourselves & follow to get event updates & reminders.</div>
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
                {followProperties.followers.length} {followProperties.followers.length > 1 ? 'members' : 'member'}{' '}
              </span>
              following gatherings at
              <span className="root__irl__follwcnt__imgsec__desccnt__desc__cnt__location">
                <img src={eventLocationSummary?.flag || '/images/irl/defaultFlag.svg'} alt="flag" style={{ width: '17px', height: '17px' }} /> {eventLocationSummary.name}{' '}
              </span>
            </div>
          </div>
        </div>

        <div className="toolbar__actionCn">
          <FollowButton eventLocationSummary={location} userInfo={userInfo} followProperties={followProperties} expand={canUserAddAttendees} />

          {canUserAddAttendees && accessLevel === 'advanced' && (
            <div className="toolbar__actionCn__add">
              <button className="toolbar__actionCn__add__btn" onClick={onAddMemberClick}>
                <img src="/icons/add.svg" width={16} height={16} alt="add" />
                <span className="toolbar__actionCn__add__btn__txt">Member</span>
              </button>
            </div>
          )}

          {isUserLoggedIn && !canUserAddAttendees && type === 'past' && !isUserGoing && accessLevel === 'advanced' && (
            <button onClick={() => onIAmGoingClick('mark-presence')} className="toolbar__actionCn__imGoingBtn">
              Claim Attendance
            </button>
          )}

          {!isUserGoing && isUserLoggedIn && !inPastEvents && accessLevel === 'advanced' && (
            <button onClick={() => onIAmGoingClick('upcoming')} className="toolbar__actionCn__imGoingBtn">
              I&apos;m Going
            </button>
          )}

          {!isUserLoggedIn && (
            <button onClick={onLoginClick} className="toolbar__actionCn__login">
              Login to Respond
            </button>
          )}

          {isUserGoing && isUserLoggedIn && (!inPastEvents || (inPastEvents && inPastEventsAndHaveEvents)) && accessLevel === 'advanced' && (
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

        <div className={`root__irl__follcnt__update__mob ${!isShrunk ? 'hideCnt' : 'showCnt'}`}>Planning to attend? Enroll yourselves & follow to get event updates & reminders.</div>
      </div>
      <PresenceRequestSuccess />
      <style jsx>
        {`
          .root__irl__follwcnt {
            display: flex;
            padding: 10px;
            transition: all 0.3s ease-in-out;
            padding-top: ${!isShrunk ? '0px' : ''};
            padding-bottom: ${!isShrunk ? '0px' : ''};
            width: 100%;
          }

          .showCntr {
            // padding-block: 0px;
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

          .root__irl__follwcnt__followbtn {
            padding: 4px 8px;
            min-width: 103px;
            border: 1px solid #cbd5e1;
            background: #fff;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            align-items: center;
            color: #0f172a;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            box-shadow: 0px 1px 1px 0px #0f172a14;
          }

          .root__irl__follwcnt__followingbtn {
            padding: 4px 8px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            align-items: center;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            border: 1px solid #cbd5e1;
            box-shadow: 0px 1px 1px 0px #0f172a14;
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
            text-transform: capitalize;
          }

          .popup__footer {
            display: flex;
            justify-content: end;
            gap: 10px;
            margin-top: 16px;
            padding: 10px 10px 0px 0px;
          }

          .popup__footer__cancel {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            color: #0f172a;
            background: #fff;
            border: 1px solid #cbd5e1;
            padding: 10px 24px;
            border-radius: 8px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .popup__footer__confirm {
            height: 40px;
            border-radius: 8px;
            padding: 10px 24px;
            background: #dd2c5a;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            color: #ffffff;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .root__irl__follcnt__update__web,
          .root__irl__follcnt__update__mob {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            letter-spacing: 0.01em;
            text-align: left;
          }

          .toolbar__actionCn {
            display: flex;
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
            padding: 10px 8px;
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
            width: ${!canUserAddAttendees ? '162px' : '127px'};
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
            padding: ${canUserAddAttendees ? '10px 8px' : '10px 25px'};
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
            width: 170px;
            color: #fff;
          }

          .root__irl__follwcnt__imgsec__desccnt {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            align-items: center;
          }

          @media (min-width: 360px) {
            .root__irl__follcnt__update__web {
              display: none;
            }

            .root__irl__follcnt__update__mob {
              display: flex;
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

            .toolbar__actionCn__webView,
            .toolbar__actionCn__webView__follCnt {
              display: none;
            }

            .root__irl__follwcnt {
              display: flex;
              flex-direction: column-reverse;
              gap: 12px;

              justify-content: space-between;
              align-items: flex-start;
            }
          }

          @media (min-width: 768px) {
            .root__irl__follwcnt {
              width: 100%;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              padding: 10px;
            }

            .root__irl__follcnt__update__mob {
              display: none;
            }
            .root__irl__follcnt__update__web {
              display: flex;
            }

            .root__irl__follwcnt__imgsec {
              display: flex;
            }

            .root__irl__follwcnt__followbtn {
              padding: 10px 16px;
            }

            .root__irl__follwcnt__followingbtn {
              padding: 10px 16px;
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

            .toolbar__actionCn__imGoingBtn {
              //width: 132px !important;
              width: auto !important;
            }

            .toolbar__actionCn__edit {
              padding: 10px 12px;
            }
          }

          @media (min-width: 1024px) {
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

export default FollowSection;
