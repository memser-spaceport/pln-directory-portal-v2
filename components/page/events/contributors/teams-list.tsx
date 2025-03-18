"use client"

import { Team } from "@/utils/constants/events-constants"
import { useState } from "react"
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"

interface TeamsTreemapProps {
  teams?: Team[]
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  height?: number
}

// Define a proper type for the custom content props
interface CustomContentProps {
  root?: any
  depth?: number
  x?: number
  y?: number
  width?: number
  height?: number
  index?: number
  payload?: any
  colors?: string[]
  rank?: number
  name?: string
}

export default function TeamsTreemap({
  teams = [],
  backgroundColor = "#E5F7FF",
  borderColor = "#ffffff",
  textColor = "#0F172A",
  height = 400,
}: TeamsTreemapProps) {
  const [activeIndex, setActiveIndex] = useState(-1)

  // Transform the teams data to the format expected by Recharts
  const transformedData = teams.map((team) => ({
    name: team.name,
    size: team.hosts.length + team.speakers.length,
    speakers: team.speakers.length,
    hosts: team.hosts.length,
  }))

  // Custom content component
  const CustomizedContent = (props: CustomContentProps) => {
    const { x = 0, y = 0, width = 0, height = 0, index = 0, name = "" } = props

    return (
      <>
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            className={`custom-rect ${index === activeIndex ? 'active' : ''}`}
          />
          {width > 70 && height > 40 && (
            <text
              x={x + 10}
              y={y + 20}
              className="custom-text"
            >
              {name}
            </text>
          )}
        </g>
        <style jsx>{`
          .custom-rect {
            stroke: ${borderColor};
            stroke-width: 2;
            cursor: pointer;
          }
          .custom-rect.active {
            fill: #B3E7FF;
          }
          .custom-rect:not(.active) {
            fill: ${backgroundColor};
          }
          .custom-text {
            fill: #000000;
            font-size: 16px;
            font-weight: 500;
            text-anchor: start;
            stroke: none;
            stroke-width: 0;
            paint-order: fill;
            font-family: 'Inter, sans-serif';
          }
        `}</style>
      </>
    )
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{data.name}</p>
          <p className="tooltip-text">{data.speakers} speakers</p>
          <p className="tooltip-text">{data.hosts} hosts</p>
        </div>
      )
    }
    return null
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="no-data">
        <p>No team data available</p>
      </div>
    )
  }

  return (
    <div className="treemap-container">
      <div className="treemap-background">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={transformedData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke={borderColor}
            fill={backgroundColor}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(-1)}
            content={<CustomizedContent />}
            isAnimationActive={true}
            animationDuration={500}
            animationEasing="ease-out"
          >
            <RechartsTooltip content={CustomTooltip} />
          </Treemap>
        </ResponsiveContainer>
      </div>
      <style jsx>{`
        .custom-tooltip {
          background-color: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .tooltip-title {
          font-weight: 600;
          margin-bottom: 4px;
        }
        .tooltip-text {
          font-size: 14px;
        }
        .no-data {
          width: 100%;
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: #f8fafc;
          color: #666;
          font-style: italic;
        }
        .treemap-container {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .treemap-background {
          height: 400px;
          background-color: #f8fcff;
        }
      `}</style>
    </div>
  )
}

