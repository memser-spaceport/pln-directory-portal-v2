"use client"

import {
  Treemap as RechartsTreemap,
  ResponsiveContainer as RechartsResponsiveContainer,
  Tooltip as RechartsTooltip,
  Rectangle,
} from "recharts"

export const Treemap = RechartsTreemap
export const ResponsiveContainer = RechartsResponsiveContainer
export const Tooltip = RechartsTooltip

// Custom treemap content component
export const TreemapCustomContent = (props: any) => {
  const { x, y, width, height, index, name, depth, colors, root, activeIndex } = props
  
  return (
    <g>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          // fill: index === activeIndex ? "#B3E7FF" : "#E5F7FF",
          stroke: "#ffffff",
          strokeWidth: 1,
          cursor: "pointer",
        }}
      />
      {width > 50 && height > 50 && (
        <foreignObject x={x} y={y} width={width} height={height}>
          <div
            style={{
              padding: '8px',
              color: '#000000', 
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {name}
          </div>
        </foreignObject>
      )}
    </g>
  )
}

// Custom tooltip component
export const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-title">{payload[0].payload.name} (Team)</p>
        <p className="tooltip-text">{payload[0].payload.speakers} Speakers</p>
        <p className="tooltip-text">{payload[0].payload.hosts} Hosts</p>
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
        `}</style>
      </div>
    )
  }
  return null
}

