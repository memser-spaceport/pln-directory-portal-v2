'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { EVENTS } from '@/utils/constants';
import HostSpeakersList from '../hosts-speakers-list';
import { useEventsAnalytics } from '@/analytics/events.analytics';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { EmptyState } from '@/components/common/EmptyState';

import s from './ContributorsSection.module.scss';
import { useMedia } from 'react-use';

interface MembersListProps {
  members?: any[];
  userInfo?: any;
}

const MembersList: React.FC<MembersListProps> = ({ members = [], userInfo }) => {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);
  const analytics = useEventsAnalytics();
  const { onContributorsViewMoreClicked } = analytics;
  const isMobile = useMedia('(max-width: 960px)', false);

  if (!members || members.length === 0) {
    return (
      <EmptyState
        title="No contributors match your search"
        description="Try a different keyword or clear filters."
      />
    );
  }

  const contributors = members.filter(
    (item) =>
      item.isHost ||
      item.isSpeaker ||
      (item.events && item.events.some((event: { isHost: any; isSpeaker: any }) => event.isHost || event.isSpeaker)),
  );

  const MAX_VISIBLE_MEMBERS = isMobile ? 30 : 100;
  const visibleMembers = contributors.slice(0, MAX_VISIBLE_MEMBERS);
  const remainingCount = contributors.length - MAX_VISIBLE_MEMBERS;

  const onCloseContributorsModal = () => {
    analytics.onContributtonModalCloseClicked();
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, { detail: false }));
  };

  const onOpenContributorsModal = () => {
    onContributorsViewMoreClicked({
      remainingCount,
      totalCount: contributors.length,
      visibleCount: MAX_VISIBLE_MEMBERS,
    });
    analytics.onContributtonModalOpenClicked();
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, { detail: true }));
  };

  const onContributorClick = (contributor: any) => {
    analytics.onContributingMembersClicked(contributor);
    window.open('/members/' + contributor.member?.uid || contributor.memberUid, '_blank');
  };

  const countRoleEvents = (member: { events: any[] }) => {
    const hostEvents = member.events.filter((event: any) => event.isHost).length;
    const speakerEvents = member.events.filter((event: any) => event.isSpeaker).length;
    const sponsorEvents = member.events.filter((event: any) => event.isSponsor).length;
    return { hostEvents, speakerEvents, sponsorEvents };
  };

  return (
    <>
      <div className="members-container">
        <div className="members-grid">
          {visibleMembers?.map((member) => {
            const { hostEvents, speakerEvents, sponsorEvents } = countRoleEvents(member);
            const defaultAvatar = getDefaultAvatar(member?.member?.name);

            return (
              <Tooltip
                key={member.memberUid}
                trigger={
                  <div
                    className={`member-avatar ${hoveredMember === member.memberUid ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredMember(member.memberUid)}
                    onMouseLeave={() => setHoveredMember(null)}
                    onClick={() => onContributorClick(member)}
                  >
                    <div className="image-container">
                      <Image
                        src={member.member?.image?.url || defaultAvatar}
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
                    {member.isHost || hostEvents > 0 ? (
                      <div>As Host {hostEvents > 0 ? `(${hostEvents})` : ''}</div>
                    ) : null}
                    {member.isSpeaker || speakerEvents > 0 ? (
                      <div>As Speaker {speakerEvents > 0 ? `(${speakerEvents})` : ''}</div>
                    ) : null}
                    {member.isSponsor || sponsorEvents > 0 ? (
                      <div>As Sponsor {sponsorEvents > 0 ? `(${sponsorEvents})` : ''}</div>
                    ) : null}
                  </div>
                }
              />
            );
          })}
          {remainingCount > 0 && (
            <div className="member-avatar more-members" onClick={() => onOpenContributorsModal()}>
              <div className="image-container remaining-badge">+{remainingCount}</div>
            </div>
          )}
        </div>
        <HostSpeakersList
          onContributorClickHandler={onContributorClick}
          onClose={onCloseContributorsModal}
          contributorsList={contributors}
        />
      </div>
      <style jsx>{`
        .members-container {
          width: 100%;
        }

        .tooltip-content {
          padding: 4px;
        }

        .more-members {
          cursor: pointer;
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 36px);
          grid-gap: 8px;
          justify-content: flex-start;
          width: 100%;
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

        .remaining-badge {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          color: #ffffff;
          background-color: #156ff7;
        }

        .no-members {
          //padding: 16px;
          //color: #666;
          //font-style: italic;

          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #5e718d;
          font-size: 14px;
          text-align: center;
        }

        .member-name {
          font-size: 0.875rem;
          color: #0f172a;
          font-weight: 500;
          margin: 0;
        }

        .remaining-title {
          font-weight: 500;
          font-size: 16px;
          margin-bottom: 0.25rem;
          color: #0f172a;
        }

        :global(.member-image) {
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid transparent;
        }

        :global(.member-image:hover) {
          border: 1.5px solid #4ef286;
        }

        /* Mobile styles - optimize for smaller screens */
        @media (max-width: 480px) {
          .members-grid {
            grid-template-columns: repeat(auto-fill, 34px);
            grid-gap: 6px;
          }

          .remaining-badge {
            width: 34px;
            height: 34px;
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
};

export default MembersList;
