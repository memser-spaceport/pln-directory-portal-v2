"use client"

import { useRef, useState } from "react";
import IrlEditResponse from "./events/irl-edit-response";
import { IUserInfo } from "@/types/shared.types";
import { useSearchParams } from "next/navigation";
import useClickedOutside from "@/hooks/useClickedOutside";
import { EVENTS, IAM_GOING_POPUP_MODES } from "@/utils/constants";
import { useIrlAnalytics } from "@/analytics/irl.analytics";

interface IIrlHeaderProps {
  searchParams: any;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  isUserGoing: boolean;
  guestDetails: any;
}

const IrlMobileHeader = (props: IIrlHeaderProps) => {

  const editResponseRef = useRef<HTMLButtonElement>(null);
  const guestDetails = props?.guestDetails;
  const isUserGoing = guestDetails?.isUserGoing;
  const updatedUser = guestDetails?.currentGuest ?? null;
  const isUserLoggedIn = props?.isLoggedIn;
  const analytics = useIrlAnalytics();
  const searchParam = useSearchParams();
  const type = searchParam.get('type');
  const [isEdit, seIsEdit] = useState(false);
  
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
  
  const inPastEvents = type ? type === 'past' : (guestDetails?.pastEvents && guestDetails?.pastEvents.length > 0 && guestDetails.upcomingEvents && guestDetails?.upcomingEvents?.length === 0);
  
  return (
    <>
        <div className="irlstickyHeader">
          {isUserGoing && isUserLoggedIn && !inPastEvents && (
            <IrlEditResponse
              isEdit={isEdit}
              onEditResponseClick={onEditResponseClick}
              onEditDetailsClicked={onEditDetailsClicked}
              onRemoveFromGatherings={onRemoveFromGatherings}
            />
          )}
        </div>
      <style jsx> {`
          .irlstickyHeader {
            padding: 15px 20px;
            background-color: #DBEAFE;
          }

        `}</style>
    </>
  )
}

export default IrlMobileHeader;