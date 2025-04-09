"use client"

import {
  Treemap as RechartsTreemap,
  ResponsiveContainer as RechartsResponsiveContainer,
  Tooltip as RechartsTooltip,
  Rectangle,
} from "recharts"
import { useEventsAnalytics } from "@/analytics/events.analytics"

export const Treemap = RechartsTreemap
export const ResponsiveContainer = RechartsResponsiveContainer
export const Tooltip = RechartsTooltip

// Custom treemap content component
export const TreemapCustomContent = (props: any) => {
  const { x, y, width, height, index, name, depth, colors, root, activeIndex, logo, uid } = props;

  const analytics = useEventsAnalytics();
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

    const onContributorClick = (contributor: any) => {
      analytics.onContributingTeamClicked(contributor);
      window.open('/teams/' + contributor, '_blank');
    };

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
          <foreignObject x={x} y={y} width={width} height={height} onClick={() => onContributorClick(uid)} style={{ cursor: 'pointer' }}>
            <div className="treemap-content">
              {width > 10 && height > 10 && (
                <img 
                  src={logo || "/icons/team-default-profile.svg"} 
                  alt={name} 
                  style={{
                    height: (() => {
                      if (width && height > 30) return '20px';
                      if (width && height > 20) return '12px';
                      if (width && height > 15) return '8px';
                      if (width && height > 10) return '6px';
                      return '4px';
                    })(),
                    width: (() => {
                      if (height > 30 && width > 30) return '20px';
                      if (height > 20 && width > 20) return '12px';
                      if (height > 15 && width > 15) return '8px';
                      if (height > 10 && width > 10) return '6px';
                      return '4px';
                    })(),
                    objectFit: 'contain'
                  }}
                />
              )}
                {width > 20 && height > 20 && (
                <div
                  style={{
                    padding: '0px 0px 0px 4px',
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
          padding: 4px 0px 0px 6px;
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
        {payload[0].payload.speakers > 0 && <p className="tooltip-text">{payload[0].payload.speakers} Speaker(s)</p>}
        {payload[0].payload.hosts > 0 && <p className="tooltip-text">{payload[0].payload.hosts} Host(s)</p>}
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

