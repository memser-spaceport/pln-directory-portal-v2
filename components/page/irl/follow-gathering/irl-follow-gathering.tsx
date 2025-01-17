"use client";

import { IUserInfo } from "@/types/shared.types";
import FollowSection from "./follow-section";

interface IrlFollowGatheringProps {
  searchParams: any;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  followers: any;
  eventLocationSummary: any;
}

const IrlFollowGathering = (props: IrlFollowGatheringProps) => {
  return (
    <>
      <div className="root">
          <FollowSection searchParams={props.searchParams} userInfo={props.userInfo} followers={props.followers} eventLocationSummary={props.eventLocationSummary} />
      </div>

      <style jsx>{`
        .root {
          background-color: #DBEAFE;
        }

        @media (min-width: 360px) {
          .root {
            border-radius: none;
            width: 900px;
          }
        }

        @media (min-width: 1024px) {
          .root {
            border-radius:  0px 0px 8px 8px;
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