"use client"

import { useState } from "react"
import Image from "next/image"
import { Tooltip } from "@/components/core/tooltip/tooltip"
import type { Member } from "@/utils/constants/events-constants"

interface MembersListProps {
  members?: Member[]
  maxVisible?: number
  hiddenCount?: number
}

const MembersList: React.FC<MembersListProps> = ({
  members = [],
  maxVisible = 59,
  hiddenCount = 3,
}) => {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null)

  if (!members || members.length === 0) {
    return <div className="no-members">No members available</div>
  }

  const visibleMembers = members.slice(0, members.length - hiddenCount)
  const hiddenMembers = members.slice(members.length - hiddenCount)

  return (
    <>
      <div className="members-grid">
        {visibleMembers.map((member) => (
          <Tooltip
            key={member.uid}
            trigger={
              <div
                className={`member-avatar ${hoveredMember === member.uid ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredMember(member.uid)}
                onMouseLeave={() => setHoveredMember(null)}
              >
                <div className="image-container">
                  {member.image && (
                    <Image
                      src={typeof member.image === 'string' ? member.image : (member.image as { url: string }).url || "/icons/default-user-profile.svg"}
                      alt={member.name}
                      width={40}
                      height={40}
                      className="member-image"
                    />
                  )}
                </div>
              </div>
            }
            content={<p>{member.name}</p>}
          />
        ))}
        {members.length > hiddenCount && (
          <Tooltip
          trigger={
            <div className="member-avatar more-members">
              <div className="image-container fallback-avatar">
                +{hiddenCount}
              </div>
            </div>
          }
          content={
            <div>
              <p className="font-medium mb-1">Remaining members:</p>
              {hiddenMembers.map((member) => (
                <p key={member.uid} className="text-sm">
                  {member.name}
                </p>
              ))}
            </div>
          }
          />
        )}
      </div>
      <style jsx>{`
        .members-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .member-avatar {
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border-radius: 50%;
            height: 40px;
            width: 40px;
          }

          .member-avatar.hovered {
            transform: translateY(-4px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }

          .image-container {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            overflow: hidden;
            background: white;
          }

          .fallback-avatar {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 500;
            color: #64748b;
          }

          :global(.member-image) {
            object-fit: cover;
            border-radius: 50%;
          }
          
          :global(.image-container) {
            background: white;
          }

          .no-members {
            padding: 16px;
            color: #666;
            font-style: italic;
          }
        `}</style>
      </>
  )
}

export default MembersList
