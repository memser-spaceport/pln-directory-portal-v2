"use client"

import MembersList from "@/components/page/events/contributors/members-list"
import { Treemap as TeamsTreemap } from "@/components/core/events/treemap"
import { ResponsiveContainer } from "@/components/core/events/treemap"
import { Tooltip } from "@/components/core/events/treemap"
import { ChartTooltip } from "@/components/core/events/treemap"
import { TreemapCustomContent } from "@/components/core/events/treemap"
import ShadowButton from "@/components/ui/ShadowButton"
import Link from "next/link"
// import { useRef } from "react"
// import { useScrollToSection } from "@/hooks/useScrollToSection" 
import { useEventsAnalytics } from "@/analytics/events.analytics"
import { getAnalyticsUserInfo } from "@/utils/common.utils"

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
  userInfo?: any
}

export default function ContributorsSection({
  members = [],
  teams = [],
  title = "Contributors",
  treemapConfig = {
    backgroundColor: "#E5F7FF",
    borderColor: "#ffffff",
    height: 400,
  },
  userInfo,
}: ContributorsSectionProps) {
  // const contributorsSectionRef = useRef<HTMLDivElement>(null)
  // const { scrollMarginTop } = useScrollToSection(contributorsSectionRef, "contributors", 80)
  const { onContributorListOpenClicked } = useEventsAnalytics();

  return (
    <div 
      // ref={contributorsSectionRef} 
      id="contributors" 
      className={`contributors-container`}
      // style={{ scrollMarginTop }}
    >
      <div className="contributors-section-container">
        <div className="contributors-header">
          <div>
            <h1 className="contributors-title">{title}</h1>
          </div>
            <ShadowButton
              buttonColor="#156FF7"
              shadowColor="#3DFEB1"
              buttonWidth="121px"
              onClick={() => onContributorListOpenClicked(getAnalyticsUserInfo(userInfo), {})}
              >
              <Link href="#">
                Contribute
              </Link>
            </ShadowButton>
        </div>

        <div className="section-container">
          <h2 className="section-title section-title-members">Members, Speakers & Hosts</h2>
          <MembersList members={members} userInfo={userInfo} />
        </div>
      </div>

      <div className="section-container teams-section-container">
        <h2 className="section-title section-title-teams">Teams</h2>
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
        }

        .contributors-section-container {
          padding: 20px;
          background: #ffffff;
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

        .teams-section-container {
          padding: 20px;
          border-top: 1px solid #E2E8F0;
          background: #ffffff;
          margin-top: 20px;
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
          margin-bottom: 10px;
        }

        .section-title {
          display: inline-block;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 20px;
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

        @media (min-width: 1024px) {
          .teams-section-container {
            margin-top: unset;
          }
        }
      `}</style>
    </div>
  )
}

