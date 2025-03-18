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

export default function MembersList({
  members = [],
  maxVisible = 59, // Maximum number of members to show before truncating
  hiddenCount = 3, // Number of members to hide and show in the "+X" avatar
}: MembersListProps) {
  const [hoveredMember, setHoveredMember] = useState<number | null>(null)

  if (!members || members.length === 0) {
    return <div className="no-members">No members available</div>
  }

  // Calculate how many members to show based on maxVisible and total count
  const totalToShow = Math.min(members.length, maxVisible)

  // If we have fewer members than the hiddenCount, show all of them
  if (members.length <= hiddenCount) {
    return (
      <div className="members-grid">
        {members.map((member) => (
          <Tooltip
            key={member.id}
            trigger={
              <div
                className={`member-avatar ${hoveredMember === member.id ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredMember(member.id)}
                onMouseLeave={() => setHoveredMember(null)}
              >
                <div className="image-container">
                  {member.image ? (
                    <Image
                      src={member.image || "/icons/default-user-profile.svg"}
                      alt={member.name}
                      width={40}
                      height={40}
                      className="member-image"
                    />
                  ) : (
                    <div className="fallback-avatar">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            }
            content={<p>{member.name}</p>}
          />
        ))}

        <style jsx>{`
          .members-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .member-avatar {
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
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
            background-color: #f0f4f8;
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
            background-color: #f1f5f9;
          }

          :global(.member-image) {
            object-fit: cover;
          }

          .more-members {
            background-color: #f0f4f8;
          }

          .no-members {
            padding: 16px;
            color: #666;
            font-style: italic;
          }
        `}</style>
      </div>
    )
  }

  // Otherwise, show visible members and the "+X" avatar
  const visibleMembers = members.slice(0, members.length - hiddenCount)
  const hiddenMembers = members.slice(members.length - hiddenCount)

  return (
    <div>
      <div className="members-grid">
        {visibleMembers.map((member) => (
          <Tooltip
            key={member.id}
            trigger={
              <div
                className={`member-avatar ${hoveredMember === member.id ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredMember(member.id)}
                onMouseLeave={() => setHoveredMember(null)}
              >
                <div className="image-container">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={40}
                      height={40}
                      className="member-image"
                    />
                  ) : (
                    <div className="fallback-avatar">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            }
            content={<p>{member.name}</p>}
          />
        ))}
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
                <p key={member.id} className="text-sm">
                  {member.name}
                </p>
              ))}
            </div>
          }
        />
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
          background-color: #f0f4f8;
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
          background-color: #f1f5f9;
        }

        :global(.member-image) {
          object-fit: cover;
        }

        .more-members {
          background-color: #f0f4f8;
        }

        .no-members {
          padding: 16px;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}

