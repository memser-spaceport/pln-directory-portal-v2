'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EngagementChartDataPoint, LegendItem } from '../../types';
import s from './EngagementChart.module.scss';

interface EngagementChartProps {
  data: EngagementChartDataPoint[];
  legendItems: LegendItem[];
}

// Map legend labels to data keys
const LEGEND_TO_DATA_KEY: Record<string, keyof Omit<EngagementChartDataPoint, 'date'>> = {
  'Profile Viewed': 'profileViewed',
  'Investment interest': 'interested',
  'Connected': 'connected',
  'Liked': 'liked',
  'Intro made': 'introMade',
  'Feedback given': 'feedbackGiven',
  'Viewed slide': 'viewedSlide',
  'Video watched': 'videoWatched',
  'Founder profile clicked': 'founderProfileClicked',
  'Team page clicked': 'teamPageClicked',
  'Team website clicked': 'teamWebsiteClicked',
};

// Format date for X-axis
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Arrow SVG for tooltip
const TooltipArrow = () => (
  <svg width="5" height="30" viewBox="0 0 5 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 0V30L0 15L5 0Z" fill="#3d4a5c" />
  </svg>
);

// Custom tooltip component matching Figma design
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={s.tooltip}>
        <div className={s.tooltipArrow}>
          <TooltipArrow />
        </div>
        <div className={s.tooltipBody}>
          {payload.map((entry: any, index: number) => (
            <p key={index} className={s.tooltipItem}>
              {entry.name}: {entry.value}
            </p>
          ))}
          <p className={s.tooltipAction}>
            <br />
            Click to view details
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const EngagementChart: React.FC<EngagementChartProps> = ({ data, legendItems }) => {
  // Transform data to include formatted date for display
  const chartData = data.map((item) => ({
    ...item,
    dateLabel: formatDate(item.date),
  }));

  return (
    <div className={s.chartContainer}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
          <Tooltip content={<CustomTooltip />} />
          {legendItems.map((item) => {
            const dataKey = LEGEND_TO_DATA_KEY[item.label];
            if (!dataKey) return null;
            return <Bar key={dataKey} dataKey={dataKey} stackId="a" fill={item.color} name={item.label} />;
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

