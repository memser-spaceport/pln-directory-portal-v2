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
  const { x, y, width, height, index, name, depth, colors, root, activeIndex, logo } = props
  
  const colorSets = {
    // primary: ['#E5F7FF', '#C2EEFF', '#99DFFF', '#66CFFF', '#33C0FF', '#00A3FF'],
    primary: ['#E5F7FF', '#C2EEFF', '#99DFFF', '#66CFFF', '#33C0FF', '#00A3FF'],
  };
  
  const colorSet = colorSets.primary;

  const fillColor = 
    width > 500 ? colorSet[5] :
    width > 250 ? colorSet[4] :
    width > 100 ? colorSet[3] :
    width > 50 ? colorSet[2] :
    width > 30 ? colorSet[1] :
    colorSet[0];

  return (
    <>
      <g>
        <Rectangle
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fillColor}
          style={{
            stroke: "#ffffff",
            strokeWidth: 1,
          }} />
          <foreignObject x={x} y={y} width={width} height={height}>
            <div className="treemap-content">
              {width > 30 && height > 30 && <img src={logo || "/icons/team-default-profile.svg"} alt={name} height={20} width={20} />}
                {width > 50 && height > 50 && (
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
              )}
            </div>
          </foreignObject>
      </g>
      <style jsx>{`
        .treemap-content {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 8px;
        }
      `}</style>
    </>
  )
}

// Custom tooltip component
export const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-title">{payload[0].payload.name}</p>
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

