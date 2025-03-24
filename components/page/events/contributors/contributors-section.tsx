"use client"

import MembersList from "@/components/page/events/contributors/members-list"
import { Treemap as TeamsTreemap } from "@/components/core/events/treemap"
import { ResponsiveContainer } from "@/components/core/events/treemap"
import { Tooltip } from "@/components/core/events/treemap"
import { ChartTooltip } from "@/components/core/events/treemap"
import { TreemapCustomContent } from "@/components/core/events/treemap"
import ShadowButton from "@/components/ui/ShadowButton"
import Link from "next/link"
import { useRef } from "react"
import { useScrollToSection } from "@/hooks/useScrollToSection"

interface ContributorsSectionProps {
  members?: any[]
  teams?: any[]  
  title?: string
  subtitle?: string
  guestImg?: string
  treemapConfig?: {
    backgroundColor?: string
    borderColor?: string
    height?: number
  }
}

export default function ContributorsSection({
  members = [],
  teams = [],
  title = "Contributors",
  subtitle = "Speaker & Host Participation",
  guestImg = "",
  treemapConfig = {
    backgroundColor: "#E5F7FF",
    borderColor: "#ffffff",
    height: 400,
  },
}: ContributorsSectionProps) {
  // const contributorsSectionRef = useRef<HTMLDivElement>(null)
  // const scrollStyle = useScrollToSection(contributorsSectionRef, "contributors")

  return (
    <div 
      // ref={contributorsSectionRef} 
      id="contributors" 
      className="contributors-container"
      // style={scrollStyle}
    >
      <div className="contributors-header">
        <div>
          <h1 className="contributors-title">{title}</h1>
          <p className="contributors-subtitle">{subtitle}</p>
        </div>
          <ShadowButton
            buttonColor="#156FF7"
            shadowColor="#3DFEB1"
            buttonWidth="121px"
          >
            <Link href="#">
              Contribute
            </Link>
          </ShadowButton>
      </div>

      <div className="section-container">
        <h2 className="section-title section-title-members">Contributing members</h2>
        <MembersList members={members} />
      </div>

      <div className="section-container">
        <h2 className="section-title section-title-teams">Contributing teams</h2>
        <div style={{ 
          height: treemapConfig.height, 
          backgroundColor: treemapConfig.backgroundColor,
          width: "100%",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          overflow: "hidden"
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <TeamsTreemap
              data={teams.map(team => ({
                name: team.name,
                size: team.hosts + team.speakers,
                speakers: team.speakers,
                hosts: team.hosts,
                logo: team.logo
              }))}
              dataKey="size"
              content={<TreemapCustomContent />}
              fill={treemapConfig.backgroundColor}
            >
              <Tooltip content={ChartTooltip} />
            </TeamsTreemap>
          </ResponsiveContainer>
        </div>
      </div>

      <style jsx>{`
        .contributors-container {
          width: 100%;
          padding: 20px;
        }

        .contributors-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .contributors-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }

        .section-title-members {
          background-color: #E8F2FF;
        }

        .section-title-teams {
          background-color: #E0FFF3;
        }

        .contributors-subtitle {
          font-size: 16px;
          margin: 4px 0 0 0;
          color: #666;
        }

        .collaborate-button {
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 5px 0 #3DFEB1;
          transition: all 0.2s ease;
        }

        .collaborate-button:hover {
          transform: translateY(-2px);
        }

        .section-container {
          margin-bottom: 32px;
        }

        .section-title {
          display: inline-block;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .section-description {
          font-size: 14px;
          color: #666;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .contributors-header {
            flex-direction: row;
            align-items: flex-start;
            gap: 16px;
          }

          .contributors-title {
            font-size: 24px;
          }

          .contributors-subtitle {
            font-size: 14px;
          }

          .collaborate-button {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

