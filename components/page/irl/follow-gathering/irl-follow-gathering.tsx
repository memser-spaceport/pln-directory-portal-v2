"use client";

import { IUserInfo } from "@/types/shared.types";
import FollowSection from "./follow-section";
import { ILocationDetails } from "@/types/irl.types";
import { checkAdminInAllEvents } from "@/utils/irl.utils";
import { useCallback } from "react";
import { TOAST_MESSAGES } from "@/utils/constants";
import router from "next/router";
import Cookies from 'js-cookie';
import { useRouter } from "next/navigation";

interface IrlFollowGatheringProps {
  searchParams: any;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  followers: any;
  eventLocationSummary: any;
  eventDetails: ILocationDetails;
  guestDetails: any;
}

const IrlFollowGathering = (props: IrlFollowGatheringProps) => {
  const eventDetails = props.eventDetails;
  const searchParams = props.searchParams;
  const locationEvents = props.eventDetails;
  const router = useRouter();
  const isLoggedIn = props.isLoggedIn;

  const isAdminInAllEvents = checkAdminInAllEvents(searchParams?.type, locationEvents?.upcomingEvents, locationEvents?.pastEvents);
  const onLogin = useCallback(async () => {
    const toast = (await import('react-toastify')).toast;
    if (Cookies.get('refreshToken')) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      window.location.reload();
    } else {
      router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
    }
  }, [router]);
  
  return (
    <>
      <div className="root">
          <FollowSection searchParams={props.searchParams} userInfo={props.userInfo} followers={props.followers} eventLocationSummary={props.eventLocationSummary} locationEvents={eventDetails} eventDetails={eventDetails} onLogin={onLogin} isLoggedIn={isLoggedIn} isAdminInAllEvents={isAdminInAllEvents} guestDetails={props.guestDetails} />
      </div>

      <style jsx>{`
        .root {
          background-color: #DBEAFE;
          display: flex;
        }

        @media (min-width: 360px) {
          .root {
            border-radius: none;
            // width: 900px;
          }
        }

        @media (min-width: 1024px) {
          .root {
            border-radius: 8px;
            border-top: none;
          }
        }

        @media (min-width: 1440px) {
          .root {
            width: 1244px;
          }
        }

        @media (min-width: 1920px) {
          .root {
            width: 1678px;
          }
        }

        @media (min-width: 2560px) {
          .root {
            width: 2240px; 
          }
        }
      `}</style>
    </>
  )
}

export default IrlFollowGathering;