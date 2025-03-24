"use client"

import { useState } from "react"
import Image from "next/image"
import { Tooltip } from "@/components/core/tooltip/tooltip"
import { Tooltip as Popover } from "@/components/page/irl/attendee-list/attendee-popover"

interface MembersListProps {
  members?: any[]
}

const MembersList: React.FC<MembersListProps> = ({
  members = [],
}) => {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null)
  
  if (!members || members.length === 0) {
    return <div className="no-members">No members available</div>
  }

  // Filter members to only include those with valid images
  const membersWithImages = members.filter(member => member?.image?.url);
  
  // Get the visible members for each view
  const mobileVisibleMembers = membersWithImages.slice(0, 39)
  const webVisibleMembers = membersWithImages.slice(0, 59)

  console.log(webVisibleMembers, 'webVisibleMembers')
  
  return (
    <>
      <div className="members-container">
        <div className="members-grid mobile-grid">
          {mobileVisibleMembers.map((member) => (
            <Tooltip
              key={`mobile-${member.uid}`}
              trigger={
                <div
                  className={`member-avatar ${hoveredMember === member.uid ? "hovered" : ""}`}
                  onMouseEnter={() => setHoveredMember(member.uid)}
                  onMouseLeave={() => setHoveredMember(null)}
                >
                  <div className="image-container">
                    <Image
                      src={member.image.url}
                      alt={member.name}
                      width={36}
                      height={36}
                      className="member-image"
                    />
                  </div>
                </div>
              }
              content={<p>{member.name}</p>}
            />
          ))}
          {membersWithImages.length > 39 && (
            <Tooltip
              trigger={
                <div className="member-avatar more-members">
                  <div className="image-container fallback-avatar">
                    +{membersWithImages.length - 39}
                  </div>
                </div>
              }
              content={
                <div style={{ overflow: 'auto', backgroundColor: 'white' }}>
                  <p className="remaining-title">Remaining members:</p>
                  {membersWithImages.slice(39).map((member) => (
                    <p key={member.uid} className="member-name">
                      {member.name}
                    </p>
                  ))}
                </div>
              }
            />
          )}
        </div>

        <div className="members-grid web-grid">
          {webVisibleMembers.map((member) => (
            <Tooltip
              key={`web-${member.uid}`}
              trigger={
                <div
                  className={`member-avatar ${hoveredMember === member.uid ? "hovered" : ""}`}
                  onMouseEnter={() => setHoveredMember(member.uid)}
                  onMouseLeave={() => setHoveredMember(null)}
                >
                  <div className="image-container">
                    <Image
                      src={member.image.url}
                      alt={member.name}
                      width={36}
                      height={36}
                      className="member-image"
                    />
                  </div>
                </div>
              }
              content={<p>{member.name}</p>}
            />
          ))}
          {membersWithImages.length > 59 && (
            <Popover
              trigger={
                <div className="member-avatar more-members">
                  <div className="image-container fallback-avatar">
                    +{membersWithImages.length - 59}
                  </div>
                </div>
              }
              content={
                <div style={{ overflow: 'auto', backgroundColor: 'white' }}>
                  <p className="remaining-title">Remaining members:</p>
                  {membersWithImages.slice(59).map((member) => (
                    <p key={member.uid} className="member-name">
                      {member.name}
                    </p>
                  ))}
                </div>
              }
            />
          )}
        </div>
      </div>
      <style jsx>{`
        .members-container {
          width: 100%;
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
          cursor: pointer;
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

        .fallback-avatar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
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
          background-color: #ffffff;
          color: #0F172A;
        }

        .remaining-title {
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        /* Mobile styles - optimize for smaller screens */
        @media (max-width: 480px) {
          .members-grid {
            grid-template-columns: repeat(auto-fill, 36px);
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
