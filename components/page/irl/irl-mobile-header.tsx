'use client';

import { useEffect, useRef, useState } from 'react';
import IrlEditResponse from './events/irl-edit-response';
import { IUserInfo } from '@/types/shared.types';
import { useRouter, useSearchParams } from 'next/navigation';
import useClickedOutside from '@/hooks/useClickedOutside';
import { EVENTS, IAM_GOING_POPUP_MODES } from '@/utils/constants';
import { useIrlAnalytics } from '@/analytics/irl.analytics';
import FollowButton from './follow-gathering/follow-button';

interface IIrlHeaderProps {
  searchParams: any;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  isUserGoing: boolean;
  guestDetails: any;
  eventLocationSummary: any;
  followers: any;
}

const IrlMobileHeader = (props: IIrlHeaderProps) => {
  const editResponseRef = useRef<HTMLButtonElement>(null);
  const guestDetails = props?.guestDetails;
  const eventLocationSummary = props?.eventLocationSummary;
  const userInfo = props?.userInfo;
  const isUserGoing = guestDetails?.isUserGoing;
  const updatedUser = guestDetails?.currentGuest ?? null;
  const isUserLoggedIn = props?.isLoggedIn;
  const analytics = useIrlAnalytics();
  const searchParam = useSearchParams();
  const type = searchParam.get('type');
  const [isEdit, seIsEdit] = useState(false);
  const [followProperties, setFollowProperties] = useState<any>({ followers: [], isFollowing: false });
  const router = useRouter();

  function getFollowProperties(followers: any) {
    return {
      followers: followers ?? [],
      isFollowing: followers.some((follower: any) => follower.memberUid === userInfo?.uid),
    };
  }

  useClickedOutside({
    ref: editResponseRef,
    callback: () => {
      seIsEdit(false);
    },
  });

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
      telegramId: updatedUser?.telegramId,
      officeHours: updatedUser?.officeHours ?? '',
    };

    document.dispatchEvent(
      new CustomEvent(EVENTS.OPEN_IAM_GOING_POPUP, {
        detail: { isOpen: true, formdata: formData, mode: IAM_GOING_POPUP_MODES.EDIT },
      }),
    );
  };

  const inPastEvents = type
    ? type === 'past'
    : guestDetails?.pastEvents &&
      guestDetails?.pastEvents.length > 0 &&
      guestDetails.upcomingEvents &&
      guestDetails?.upcomingEvents?.length === 0;
  const inPastEventsAndHaveEvents = inPastEvents && guestDetails?.pastEvents && guestDetails?.pastEvents.length > 0;
  const onLoginClick = () => {
    router.push(`${window.location.pathname}${window.location.search}#login`);
  };

  useEffect(() => {
    setFollowProperties(() => getFollowProperties(props.followers));
  }, [eventLocationSummary.uid, props.followers]);

  useEffect(() => {
    function updateFollowers(e: any) {
      setFollowProperties(getFollowProperties(e.detail.followers));
    }
    document.addEventListener(EVENTS.UPDATE_IRL_LOCATION_FOLLOWERS, updateFollowers);
    return function () {
      document.removeEventListener(EVENTS.UPDATE_IRL_LOCATION_FOLLOWERS, updateFollowers);
    };
  }, []);

  return (
    <>
      <div className="irlMobileHeader">
        <FollowButton
          eventLocationSummary={eventLocationSummary}
          userInfo={userInfo}
          followProperties={followProperties}
        />
        {isUserGoing && isUserLoggedIn && (!inPastEvents || (inPastEvents && inPastEventsAndHaveEvents)) && (
          <IrlEditResponse
            isEdit={isEdit}
            onEditResponseClick={onEditResponseClick}
            onEditDetailsClicked={onEditDetailsClicked}
            onRemoveFromGatherings={onRemoveFromGatherings}
          />
        )}
        {!isUserLoggedIn && !inPastEvents && (
          <button onClick={onLoginClick} className="irlMobileHeader__followingBtn">
            Login to Respond
          </button>
        )}
      </div>
      <style jsx>
        {`
          .irlMobileHeader {
            padding: 10px 20px;
            background-color: #dbeafe;
            display: flex;
            align-items: flex-end;
            gap: 8px;
            width: 100%;
          }

          .irlMobileHeader__followingBtn {
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

          .irlMobileHeader__followingBtn:hover {
            background: #1d4ed8;
          }
        `}
      </style>
    </>
  );
};

export default IrlMobileHeader;
