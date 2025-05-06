"use client"

import { useState } from "react"
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"

/**
 * Props for the TeamsTreemap component.
 */
interface TeamsTreemapProps {
  teams?: any[]
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  height?: number
}

/**
 * Props for the customized treemap content renderer.
 */
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

/**
 * TeamsTreemap component displays a treemap visualization of teams, showing the number of hosts and speakers per team.
 *
 * @component
 * @param {TeamsTreemapProps} props - The props for the TeamsTreemap component.
 * @returns {JSX.Element} The rendered TeamsTreemap component.
 */
export default function TeamsTreemap({
  teams = [],
  backgroundColor = "#E5F7FF",
  borderColor = "#ffffff",
}: TeamsTreemapProps) {
  // State for the currently active (hovered) rectangle
  const [activeIndex, setActiveIndex] = useState(-1)

  // Transform the teams data for the Treemap
  const transformedData = teams.map((team) => ({
    name: team.name,
    size: team.hosts.length + team.speakers.length,
    speakers: team.speakers.length,
    hosts: team.hosts.length,
    logo: team.logo,
  }))

  /**
   * CustomizedContent renders each rectangle in the treemap, including the team name if space allows.
   * @param props - CustomContentProps for the rectangle.
   * @returns SVG group element for the rectangle and label.
   */
  const CustomizedContent = (props: CustomContentProps) => {
    const { x = 0, y = 0, width = 0, height = 0, index = 0, name = "" } = props

    return (
      <>
        {/* Rectangle for each team */}
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            className={`custom-rect ${index === activeIndex ? 'active' : ''}`}
          />
          {/* Show team name if the rectangle is large enough */}
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

  /**
   * CustomTooltip renders a tooltip for the treemap rectangles.
   * @param active - Whether the tooltip is active (hovered).
   * @param payload - Data payload for the hovered rectangle.
   * @returns Tooltip JSX or null.
   */
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

  // Show a message if there are no teams to display
  if (!teams || teams.length === 0) {
    return (
      <div className="no-data">
        <p>No team data available</p>
      </div>
    )
  }

  // Main render: Treemap visualization
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

