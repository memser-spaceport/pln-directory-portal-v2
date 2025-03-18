"use client"

import MembersList from "@/components/page/events/contributors/members-list"
import { Treemap as TeamsTreemap } from "@/components/core/events/treemap"
import { ResponsiveContainer } from "@/components/core/events/treemap"
import { Tooltip } from "@/components/core/events/treemap"
import { ChartTooltip } from "@/components/core/events/treemap"
import type { Member, Team } from "@/utils/constants/events-constants"

interface ContributorsSectionProps {
  members?: Member[]
  teams?: Team[]
  title?: string
  subtitle?: string
  onCollaborate?: () => void
  treemapConfig?: {
    backgroundColor?: string
    borderColor?: string
    textColor?: string
    height?: number
  }
}

export default function ContributorsSection({
  members = [],
  teams = [],
  title = "Contributors",
  subtitle = "Speaker & Host Participation",
  onCollaborate = () => console.log("Collaborate clicked"),
  treemapConfig = {
    backgroundColor: "#E5F7FF",
    borderColor: "#ffffff",
    textColor: "#0F172A",
    height: 400,
  },
}: ContributorsSectionProps) {
  return (
    <div className="contributors-container">
      <div className="contributors-header">
        <div>
          <h1 className="contributors-title">{title}</h1>
          <p className="contributors-subtitle">{subtitle}</p>
        </div>
        <button className="collaborate-button" onClick={onCollaborate}>
          Contribute
        </button>
      </div>

      <div className="section-container">
        <h2 className="section-title">Contributing members</h2>
        <MembersList members={members} />
      </div>

      <div className="section-container">
        <h2 className="section-title">Contributing teams</h2>
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
                size: team.hosts.length + team.speakers.length,
                speakers: team.speakers.length,
                hosts: team.hosts.length
              }))}
              dataKey="size"
              stroke={treemapConfig.borderColor}
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
          font-family: system-ui, -apple-system, sans-serif;
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
          background-color: #f0f4f8;
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
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .collaborate-button {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

