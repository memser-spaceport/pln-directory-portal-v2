'use client';

import { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import SupportSection from '../rounds/sections/support-section';
import Link from 'next/link';

// Mock data matching the Figma design exactly
// Categories in order: Projects (top), Brand, Programs, Network Tooling, People/Talent, Knowledge
const chartData = {
  'round-1': {
    'february-2025': [
      { category: 'Projects', points: 16500, tokens: 1450 },
      { category: 'Brand', points: 11000, tokens: 1350 },
      { category: 'Programs', points: 8000, tokens: 1200 },
      { category: 'Network Tooling', points: 5000, tokens: 950 },
      { category: 'People/Talent', points: 7500, tokens: 1100 },
      { category: 'Knowledge', points: 9000, tokens: 1300 },
    ],
    'march-2025': [
      { category: 'Projects', points: 3145, tokens: 1603 },
      { category: 'Brand', points: 10000, tokens: 1400 },
      { category: 'Programs', points: 12000, tokens: 1200 },
      { category: 'Network Tooling', points: 6000, tokens: 1000 },
      { category: 'People/Talent', points: 8500, tokens: 1300 },
      { category: 'Knowledge', points: 8000, tokens: 1250 },
    ],
    'april-2025': [
      { category: 'Projects', points: 14000, tokens: 1500 },
      { category: 'Brand', points: 12000, tokens: 1350 },
      { category: 'Programs', points: 9500, tokens: 1250 },
      { category: 'Network Tooling', points: 7000, tokens: 1050 },
      { category: 'People/Talent', points: 10000, tokens: 1400 },
      { category: 'Knowledge', points: 11000, tokens: 1450 },
    ],
    'may-2025': [
      { category: 'Projects', points: 17500, tokens: 1550 },
      { category: 'Brand', points: 13500, tokens: 1450 },
      { category: 'Programs', points: 11000, tokens: 1300 },
      { category: 'Network Tooling', points: 8000, tokens: 1100 },
      { category: 'People/Talent', points: 12000, tokens: 1420 },
      { category: 'Knowledge', points: 14000, tokens: 1600 },
    ],
  },
  'round-2': {
    'february-2025': [
      { category: 'Projects', points: 15000, tokens: 1400 },
      { category: 'Brand', points: 10000, tokens: 1300 },
      { category: 'Programs', points: 7500, tokens: 1150 },
      { category: 'Network Tooling', points: 4500, tokens: 900 },
      { category: 'People/Talent', points: 7000, tokens: 1050 },
      { category: 'Knowledge', points: 8500, tokens: 1250 },
    ],
    'march-2025': [
      { category: 'Projects', points: 2800, tokens: 1500 },
      { category: 'Brand', points: 9500, tokens: 1350 },
      { category: 'Programs', points: 11000, tokens: 1150 },
      { category: 'Network Tooling', points: 5500, tokens: 950 },
      { category: 'People/Talent', points: 8000, tokens: 1250 },
      { category: 'Knowledge', points: 7500, tokens: 1200 },
    ],
    'april-2025': [
      { category: 'Projects', points: 13000, tokens: 1450 },
      { category: 'Brand', points: 11500, tokens: 1300 },
      { category: 'Programs', points: 9000, tokens: 1200 },
      { category: 'Network Tooling', points: 6500, tokens: 1000 },
      { category: 'People/Talent', points: 9500, tokens: 1350 },
      { category: 'Knowledge', points: 10500, tokens: 1400 },
    ],
    'may-2025': [
      { category: 'Projects', points: 16000, tokens: 1500 },
      { category: 'Brand', points: 13000, tokens: 1400 },
      { category: 'Programs', points: 10500, tokens: 1250 },
      { category: 'Network Tooling', points: 7500, tokens: 1050 },
      { category: 'People/Talent', points: 11500, tokens: 1380 },
      { category: 'Knowledge', points: 13500, tokens: 1550 },
    ],
  },
};

const months = [
  { id: 'february-2025', label: 'February 2025' },
  { id: 'march-2025', label: 'March 2025' },
  { id: 'april-2025', label: 'April 2025' },
  { id: 'may-2025', label: 'May 2025' },
];

const rounds = [
  { id: 'round-1', label: 'Round 1' },
  { id: 'round-2', label: 'Round 2' },
];

// Custom tooltip component with inline styles
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; payload: { category: string; points: number; tokens: number } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        background: 'white',
        border: '1px solid #e1e1e1',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0px 9px 27px -7px rgba(15, 34, 67, 0.16), 0px 1px 3px 0px rgba(15, 34, 67, 0.12), 0px 0px 1px 0px rgba(15, 34, 67, 0.16)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#44d5bb' }} />
          <span style={{ fontSize: '14px', color: '#475569', lineHeight: '20px' }}>{data.points.toLocaleString()} Points collected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#156ff7' }} />
          <span style={{ fontSize: '14px', color: '#475569', lineHeight: '20px' }}>{data.tokens.toLocaleString()} AA tokens</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tick for category labels
const renderPolarAngleAxisTick = ({ payload, x, y, cx, cy }: { payload: { value: string }; x: number; y: number; cx: number; cy: number }) => {
  const category = payload.value;
  
  // Calculate the angle for positioning
  const angle = Math.atan2(y - cy, x - cx);
  const offsetDistance = 20;
  const newX = x + Math.cos(angle) * offsetDistance;
  const newY = y + Math.sin(angle) * offsetDistance;
  
  // Determine text anchor based on position
  let textAnchor: 'start' | 'middle' | 'end' = 'middle';
  if (x > cx + 10) textAnchor = 'start';
  else if (x < cx - 10) textAnchor = 'end';
  
  return (
    <text
      x={newX}
      y={newY}
      textAnchor={textAnchor}
      dominantBaseline="middle"
      style={{ fontSize: '14px', fontWeight: 600, fill: '#475569' }}
    >
      {category}
    </text>
  );
};

// Helper function to get the top category (lowest points = highest token potential)
const getTopCategory = (data: Array<{ category: string; points: number; tokens: number }>) => {
  if (!data || data.length === 0) return 'N/A';
  const topCategory = data.reduce((min, item) => 
    item.points < min.points ? item : min
  , data[0]);
  return topCategory.category;
};

// Custom tick for radius axis with pill/badge background and shadow
const renderRadiusAxisTick = ({ payload, x, y }: { payload: { value: number }; x: number; y: number }) => {
  const value = payload.value;
  const formattedValue = value === 0 ? '0' : value.toLocaleString();
  
  // Estimate text width for background
  const textWidth = formattedValue.length * 8 + 12;
  const textHeight = 24;
  const filterId = `shadow-${value}`;
  
  return (
    <g>
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="0.5" floodColor="rgba(15,23,42,0.12)" />
          <feDropShadow dx="0" dy="4" stdDeviation="2" floodColor="rgba(15,23,42,0.04)" />
        </filter>
      </defs>
      <rect
        x={x - textWidth / 2}
        y={y - textHeight / 2}
        width={textWidth}
        height={textHeight}
        rx={4}
        ry={4}
        fill="white"
        stroke="#e1e1e1"
        strokeWidth={1}
        filter={`url(#${filterId})`}
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: '14px', fill: '#4b5563' }}
      >
        {formattedValue}
      </text>
    </g>
  );
};

export default function IncentiveModel() {
  const [selectedRound, setSelectedRound] = useState<'round-1' | 'round-2'>('round-1');
  const [selectedMonth, setSelectedMonth] = useState('march-2025');

  const currentData = chartData[selectedRound][selectedMonth as keyof typeof chartData['round-1']];

  return (
    <>
      <div className="incentive-model">
        {/* Header Section */}
        <section className="incentive-model__header">
          <h1 className="incentive-model__title">Incentive Model</h1>
          <div className="incentive-model__description">
            <p>
              Participants <Link href="/alignment-assets/rounds" className="incentive-model__link">collect points</Link> by completing verified activities that benefit the network each month. Points are collected during the snapshot period, and those points determine the number of tokens allocated to each contributor—with an available pool of up to 10,000 tokens issued per snapshot period.
            </p>
            <p>
              Each category receives a fixed allocation of monthly tokens, and participants receive a portion based on the points they collect in that category.
            </p>
            <p>
              When more people contribute in the same category, the token pool is more widely distributed; when activity is lower in a category, more tokens are available per contributor.
            </p>
            <p>
              Available token amounts and allocations may also shift between snapshot periods as the experiment adapts to network activity and evolving needs.
            </p>
          </div>
        </section>

        {/* Chart Section Header */}
        <section className="incentive-model__chart-section">
          <div className="incentive-model__chart-header">
            <div className="incentive-model__chart-info">
              <h2 className="incentive-model__chart-title">
                Total Alignment Asset Points & Tokens Collected by Category
              </h2>
              <p className="incentive-model__chart-subtitle">
                v0.1 - February 2025 - May 2025
              </p>
            </div>
            
            {/* Round Selector */}
            <div className="incentive-model__round-selector">
              {rounds.map((round) => (
                <button
                  key={round.id}
                  className={`incentive-model__round-btn ${selectedRound === round.id ? 'incentive-model__round-btn--active' : ''}`}
                  onClick={() => setSelectedRound(round.id as 'round-1' | 'round-2')}
                >
                  {round.label}
                </button>
              ))}
            </div>
          </div>

          {/* Month Tabs */}
          <div className="incentive-model__month-tabs">
            {months.map((month) => (
              <button
                key={month.id}
                className={`incentive-model__month-tab ${selectedMonth === month.id ? 'incentive-model__month-tab--active' : ''}`}
                onClick={() => setSelectedMonth(month.id)}
              >
                {month.label}
              </button>
            ))}
          </div>
        </section>

        {/* Chart and Legend Section */}
        <section className="incentive-model__chart-content">
          <div className="incentive-model__chart-wrapper">
            <ResponsiveContainer width="100%" height={600}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={currentData}>
                <PolarGrid 
                  stroke="#e2e8f0" 
                  gridType="polygon"
                  radialLines={false}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 20000]}
                  tick={renderRadiusAxisTick}
                  tickCount={5}
                  axisLine={false}
                  orientation="middle"
                />
                <PolarAngleAxis
                  dataKey="category"
                  tick={renderPolarAngleAxisTick}
                  tickLine={false}
                />
                <Radar
                  name="Points"
                  dataKey="points"
                  stroke="#44d5bb"
                  fill="rgba(68, 213, 187, 0.1)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#44d5bb', strokeWidth: 0 }}
                />
                <Radar
                  name="Tokens"
                  dataKey="tokens"
                  stroke="#156ff7"
                  fill="rgba(21, 111, 247, 0.1)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#156ff7', strokeWidth: 0 }}
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="incentive-model__legend-wrapper">
            {/* Legend */}
            <div className="incentive-model__legend">
              <div className="incentive-model__legend-item">
                <span className="incentive-model__legend-box incentive-model__legend-box--points" />
                <span className="incentive-model__legend-text">Points</span>
              </div>
              <div className="incentive-model__legend-item">
                <span className="incentive-model__legend-box incentive-model__legend-box--tokens" />
                <span className="incentive-model__legend-text">Tokens</span>
              </div>
            </div>

            {/* Explanation List */}
            <ol className="incentive-model__explanation">
              <li>Each category shows the points collected and tokens distributed for the selected month&apos;s snapshot.</li>
              <li>More points collected in a category = fewer tokens allocated per contributor in that category. Lower activity in a category = larger token amounts per contributor.</li>
              <li>Toggle between months (and rounds) to see how activity and allocations shift over time, and hover over any point to view exact values. Green = points; blue = tokens.</li>
            </ol>

            {/* Tip Card */}
            <div className="incentive-model__tip-card">
              <p className="incentive-model__tip-title">
                Top category this snapshot: <span className="incentive-model__tip-category">{getTopCategory(currentData)}</span>.
              </p>
              <p className="incentive-model__tip-text">
                👉 <Link href="/alignment-assets/rounds" className="incentive-model__tip-link">View</Link> which categories offer the highest token potential today.
              </p>
            </div>
          </div>
        </section>

        {/* Learn More CTA */}
        <section className="incentive-model__learn-more">
          <div className="incentive-model__learn-more-wrapper">
            <div className="incentive-model__learn-more-container">
              <p className="incentive-model__learn-more-text">
                <Link href="/alignment-assets/faqs#point-to-token-conversion" className="incentive-model__learn-more-link">Learn more</Link>
                <span className="incentive-model__learn-more-body"> about how points convert to tokens</span>
              </p>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <SupportSection />
      </div>

      <style jsx>{`
        .incentive-model {
          display: flex;
          flex-direction: column;
          gap: 59px;
          width: 100%;
        }

        /* Header Section */
        .incentive-model__header {
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: center;
        }

        .incentive-model__title {
          font-size: 20px;
          font-weight: 600;
          color: #16161f;
          line-height: normal;
          margin: 0;
        }

        .incentive-model__description {
          display: flex;
          flex-direction: column;
          gap: 16px;
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          max-width: 1095px;
          margin: 0 auto;
        }

        .incentive-model__description p {
          margin: 0;
        }

        /* Chart Section Header */
        .incentive-model__chart-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .incentive-model__chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .incentive-model__chart-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .incentive-model__chart-title {
          font-size: 18px;
          font-weight: 600;
          color: #16161f;
          line-height: normal;
          margin: 0;
        }

        .incentive-model__chart-subtitle {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          line-height: 22px;
          margin: 0;
        }

        /* Round Selector */
        .incentive-model__round-selector {
          display: flex;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 4px;
          overflow: hidden;
        }

        .incentive-model__round-btn {
          padding: 10px 24px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          line-height: 20px;
        }

        .incentive-model__round-btn:hover {
          background: #f8fafc;
        }

        .incentive-model__round-btn--active {
          background: #156ff7;
          color: white;
          border: 1px solid #cbd5e1;
        }

        .incentive-model__round-btn--active:hover {
          background: #1260d9;
        }

        /* Month Tabs */
        .incentive-model__month-tabs {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          padding-top: 8px;
          margin-top: 72px;
        }

        .incentive-model__month-tab {
          flex: 1;
          padding: 10px 32px;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 400;
          color: #64748b;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          line-height: 20px;
        }

        .incentive-model__month-tab:hover {
          color: #0f172a;
        }

        .incentive-model__month-tab--active {
          font-weight: 600;
          color: #0f172a;
          border-bottom-color: #156ff7;
        }

        /* Chart Content */
        .incentive-model__chart-content {
          display: flex;
          gap: 100px;
          align-items: flex-start;
          justify-content: center;
          min-height: 630px;
        }

        .incentive-model__chart-wrapper {
          flex: 1;
          max-width: 637px;
          min-width: 300px;
          width: 100%;
          height: 600px;
          position: relative;
        }

        .incentive-model__legend-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 30px 0;
          max-width: 324px;
        }

        /* Legend */
        .incentive-model__legend {
          display: flex;
          gap: 24px;
        }

        .incentive-model__legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .incentive-model__legend-box {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }

        .incentive-model__legend-box--points {
          background: rgba(68, 213, 187, 0.1);
          border: 1px solid #44d5bb;
        }

        .incentive-model__legend-box--tokens {
          background: rgba(21, 111, 247, 0.1);
          border: 1px solid #156ff7;
        }

        .incentive-model__legend-text {
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
          line-height: 20px;
        }

        /* Explanation List */
        .incentive-model__explanation {
          font-size: 14px;
          font-weight: 400;
          color: #475569;
          line-height: 20px;
          margin: 0;
          padding-left: 21px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .incentive-model__explanation li {
          padding-left: 4px;
        }

        /* Tip Card */
        .incentive-model__tip-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          margin-top: 24px;
        }

        .incentive-model__tip-title {
          font-size: 14px;
          font-weight: 700;
          color: #475569;
          line-height: 20px;
          margin: 0 0 8px 0;
        }

        .incentive-model__tip-category {
          font-weight: 700;
        }

        .incentive-model__tip-text {
          font-size: 14px;
          font-weight: 400;
          color: #475569;
          line-height: 20px;
          margin: 0;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 1200px) {
          .incentive-model__chart-content {
            flex-direction: column;
            gap: 40px;
            align-items: center;
          }

          .incentive-model__chart-wrapper {
            width: 100%;
            max-width: 100%;
          }

          .incentive-model__legend-wrapper {
            max-width: 100%;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .incentive-model {
            gap: 40px;
          }

          .incentive-model__header {
            text-align: left;
          }

          .incentive-model__description {
            text-align: left;
          }

          .incentive-model__chart-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .incentive-model__chart-title {
            font-size: 16px;
          }

          .incentive-model__month-tabs {
            overflow-x: auto;
            margin-top: 40px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .incentive-model__month-tabs::-webkit-scrollbar {
            display: none;
          }

          .incentive-model__month-tab {
            flex: none;
            padding: 10px 16px;
            font-size: 14px;
            white-space: nowrap;
          }

          .incentive-model__chart-content {
            gap: 32px;
          }

          .incentive-model__legend {
            flex-wrap: wrap;
          }

          .incentive-model__round-btn {
            padding: 8px 16px;
            font-size: 13px;
          }
        }

        @media (max-width: 480px) {
          .incentive-model__month-tabs {
            justify-content: flex-start;
          }

          .incentive-model__chart-wrapper {
            min-width: 100%;
            height: 400px;
          }
        }

        /* Learn More Section */
        .incentive-model__learn-more {
          width: 100%;
        }

        .incentive-model__learn-more-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .incentive-model__learn-more-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 17.5px 22px;
          background-color: white;
          border: 1.5px solid #427dff;
          border-radius: 100px;
          overflow: hidden;
        }

        .incentive-model__learn-more-text {
          font-size: 16px;
          font-weight: 500;
          line-height: 20px;
          margin: 0;
          white-space: nowrap;
        }

        .incentive-model__learn-more-body {
          color: #475569;
        }

        @media (max-width: 768px) {
          .incentive-model__learn-more-container {
            padding: 12px 16px;
          }
          
          .incentive-model__learn-more-text {
            font-size: 14px;
            white-space: normal;
            text-align: center;
          }
        }
      `}</style>

      <style jsx global>{`
        .incentive-model__link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
        }

        .incentive-model__link:hover {
          text-decoration: none;
        }

        .incentive-model__learn-more-link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
          font-weight: 500;
        }

        .incentive-model__learn-more-link:hover {
          text-decoration: none;
        }

        .incentive-model__tip-link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
          font-weight: 400;
        }

        .incentive-model__tip-link:hover {
          text-decoration: none;
        }
      `}</style>
    </>
  );
}
