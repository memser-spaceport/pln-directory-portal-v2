"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Tooltip } from "@/components/core/tooltip/tooltip"
import { Tooltip as Popover } from "@/components/page/irl/attendee-list/attendee-popover"
import { EVENTS } from "@/utils/constants"
import HostSpeakersList from "../hosts-speakers-list"
import { getAnalyticsUserInfo } from "@/utils/common.utils"
import { useEventsAnalytics } from "@/analytics/events.analytics"

interface MembersListProps {
  members?: any[]
  userInfo?: any
}

const MembersList: React.FC<MembersListProps> = ({
  members = [],
  userInfo,
}) => {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null)
  const analytics = useEventsAnalytics();

  if (!members || members.length === 0) {
    return <div className="no-members">No members available</div>
  }

  const contributors = members.filter(item => 
    item.isHost || item.isSpeaker || 
    (item.events && item.events.some((event: { isHost: any; isSpeaker: any }) => event.isHost || event.isSpeaker))
  );

  const mobileVisibleMembers = contributors.slice(0, 31)
  const webVisibleMembers = contributors.slice(0, 154)

  const onCloseContributorsModal = () => {
    analytics.onContributorListCloseClicked(getAnalyticsUserInfo(userInfo), {});
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, { detail: false }));
  };

  const onOpenContributorsModal = () => {
    analytics.onContributorListOpenClicked(getAnalyticsUserInfo(userInfo), {});
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, { detail: true }));
  };

  const onContributorClick = (contributor: any) => {
    analytics.onContributorClicked(getAnalyticsUserInfo(userInfo), contributor);
    // window.open('/members/' + contributor.member?.uid || contributor.memberUid, '_blank');
  };

  const countRoleEvents = (member: { events: any[] }) => {
    const hostEvents = member.events.filter((event: any) => event.isHost).length;
    const speakerEvents = member.events.filter((event: any) => event.isSpeaker).length;
    return { hostEvents, speakerEvents };
  };

  return (
    <>
      <div className="members-container">
        <div className="members-grid mobile-grid">
          {mobileVisibleMembers?.map((member) => {
            const { hostEvents, speakerEvents } = countRoleEvents(member);
            return (
              <Tooltip
                key={`mobile-${member.memberUid}`}
                trigger={
                  <div
                    className={`member-avatar ${hoveredMember === member.memberUid ? "hovered" : ""}`}
                    onMouseEnter={() => setHoveredMember(member.memberUid)}
                    onMouseLeave={() => setHoveredMember(null)}
                    onClick={() => onContributorClick(member)}
                  >
                    <div className="image-container">
                      <Image
                        src={member.member?.image?.url || '/icons/default-user-profile.svg'}
                        alt={member.member?.name || 'Unknown'}
                        width={34}
                        height={34}
                        className="member-image"
                      />
                    </div>
                  </div>
                }
                content={
                  <div className="tooltip-content">
                    <div>{member.member?.name}</div>
                      {member.isHost || hostEvents > 0 ? 
                        <div>As Host {hostEvents > 0 ? `(${hostEvents})` : ''}</div> : null}
                      {member.isSpeaker || speakerEvents > 0 ? 
                        <div>As Speaker {speakerEvents > 0 ? `(${speakerEvents})` : ''}</div> : null}
                  </div>
                }
              />
            );
          })}
          {contributors.length > 31 && (
            <>
              <div className="member-avatar more-members" onClick={() => onOpenContributorsModal()}>
                <div className="image-container fallback-avatar-mobile">
                  +{contributors.length - 31}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="members-grid web-grid">
          {webVisibleMembers?.map((member) => {
            const { hostEvents, speakerEvents } = countRoleEvents(member);
            return (
              <Tooltip
                key={`web-${member.memberUid}`}
                trigger={
                  <div
                    className={`member-avatar ${hoveredMember === member.memberUid ? "hovered" : ""}`}
                    onMouseEnter={() => setHoveredMember(member.memberUid)}
                    onMouseLeave={() => setHoveredMember(null)}
                    onClick={() => onContributorClick(member)}
                  >
                    <div className="image-container">
                      <Image
                        src={member.member?.image?.url || '/icons/default-user-profile.svg'}
                        alt={member.member?.name || 'Unknown'}
                        width={36}
                        height={36}
                        className="member-image"
                      />
                    </div>
                  </div>
                }
                content={
                  <div className="tooltip-content">
                    <div>{member.member?.name}</div>
                      {member.isHost || hostEvents > 0 ? 
                        <div>As Host {hostEvents > 0 ? `(${hostEvents})` : ''}</div> : null}
                      {member.isSpeaker || speakerEvents > 0 ? 
                        <div>As Speaker {speakerEvents > 0 ? `(${speakerEvents})` : ''}</div> : null}
                  </div>
                }
              />
            );
          })}
          {contributors.length > 154 && (
            <>
              <div className="member-avatar more-members">
                <div className="image-container fallback-avatar-web" onClick={() => onOpenContributorsModal()}>
                  +{contributors.length - 154}
                </div>
              </div>
            </>
          )}
        </div>
        <HostSpeakersList onContributorClickHandler={onContributorClick} onClose={onCloseContributorsModal} contributorsList={contributors} />
      </div>
      <style jsx>{`
        .members-container {
          width: 100%;
        }

        .tooltip-content {
          padding: 4px;
        }

        .more-members {
          cursor:pointer;
        }

        .popover-content {
          padding: 10px;
          border-radius: 10px;
          background-color: #F1F5F9;
          max-height: 200px;
          overflow-y: auto;
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 36px);
          grid-gap: 8px;
          justify-content: flex-start;
          width: 100%;
        }

        .web-grid {
          display: none;
        }

        .mobile-grid {
          display: grid;
        }

        .member-avatar {
          transition: transform 0.2s ease;
          width: 36px;
          height: 36px;
        }

        .member-avatar.hovered {
          transform: scale(1.1);
          z-index: 2;
        }

        .image-container {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fallback-avatar-mobile {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 500;
          color: #FFFFFF;
          background-color: #156FF7;
        }

        .fallback-avatar-web {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          color: #FFFFFF;
          background-color: #156FF7;
        }

        .no-members {
          padding: 16px;
          color: #666;
          font-style: italic;
        }

        .member-name {
          font-size: 0.875rem;
          color: #0F172A;
          font-weight: 500;
          margin: 0;
        }

        .remaining-title {
          font-weight: 500;
          font-size: 16px;
          margin-bottom: 0.25rem;
          color: #0F172A;
        }

        :global(.member-image) {
            border-radius: 50%;
            object-fit: cover;
            border: 1.5px solid transparent;        
        }

        :global(.member-image:hover) {
          border: 1.5px solid #4EF286;
        }

        :global(button .member-avatar) {
          cursor: default !important;
        }

        /* Mobile styles - optimize for smaller screens */
        @media (max-width: 480px) {
          .members-grid {
            grid-template-columns: repeat(auto-fill, 34px);
            grid-gap: 6px;
          }
        }

        /* Web styles */
        @media (min-width: 1024px) {
          .mobile-grid {
            display: none;
          }
          
          .web-grid {
            display: grid;
          }
        }
      `}</style>
    </>
  )
}

export default MembersList
