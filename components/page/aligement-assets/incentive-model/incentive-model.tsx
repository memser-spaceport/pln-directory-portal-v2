'use client';

import { useState, useRef, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import SupportSection from '../rounds/sections/support-section';
import Link from 'next/link';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import { useScrollDepthTracking } from '@/hooks/useScrollDepthTracking';

// Round nav (labels, current round, total rounds) comes from the rounds API
// now too — see page.tsx — rather than a hand-maintained list bumped every
// round roll.
export interface RoundOption {
  id: number;
  month: string;
}

// Points and tokens both come from the live rounds API now (see page.tsx) —
// points from points_activity_master via the chart field, tokens from
// round_category_tokens via tokenChart. There is no hand-typed fallback
// left in this file.
export interface RoundCategoryEntry {
  category: string;
  points: number;
  tokens: number;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload: { category: string; points: number; tokens: number } }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: 'white',
          border: '1px solid #e1e1e1',
          borderRadius: '8px',
          padding: '16px',
          boxShadow:
            '0px 9px 27px -7px rgba(15, 34, 67, 0.16), 0px 1px 3px 0px rgba(15, 34, 67, 0.12), 0px 0px 1px 0px rgba(15, 34, 67, 0.16)',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#44d5bb' }} />
          <span style={{ fontSize: '14px', color: '#475569', lineHeight: '20px' }}>
            {data.points.toLocaleString()} Points collected
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#156ff7' }} />
          <span style={{ fontSize: '14px', color: '#475569', lineHeight: '20px' }}>
            {data.tokens.toLocaleString()} PLAA
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const createRenderPolarAngleAxisTick = (labelFontSize: number, labelOffset: number) => {
  const RenderPolarAngleAxisTick = ({
    payload,
    x,
    y,
    cx,
    cy,
  }: {
    payload: { value: string };
    x: number;
    y: number;
    cx: number;
    cy: number;
  }) => {
    const category = payload.value;

    const angle = Math.atan2(y - cy, x - cx);
    const isLeftSide = x < cx;
    const isLongLabel = category.length > 10;
    const adjustedOffset = isLeftSide || isLongLabel ? labelOffset + 8 : labelOffset;

    const newX = x + Math.cos(angle) * adjustedOffset;
    const newY = y + Math.sin(angle) * adjustedOffset;

    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
    if (x > cx + 10) {
      textAnchor = 'start';
    } else if (x < cx - 10) {
      textAnchor = 'end';
    } else {
      textAnchor = 'middle';
    }

    return (
      <text
        x={newX}
        y={newY}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        style={{ fontSize: `${labelFontSize}px`, fontWeight: 600, fill: '#475569' }}
      >
        {category}
      </text>
    );
  };
  
  RenderPolarAngleAxisTick.displayName = 'RenderPolarAngleAxisTick';
  return RenderPolarAngleAxisTick;
};

const getMostActiveCategory = (data: Array<{ category: string; points: number; tokens: number }>) => {
  if (!data || data.length === 0) return 'N/A';
  const mostActive = data.reduce((max, item) => (item.points > max.points ? item : max), data[0]);
  return mostActive.category;
};

const createRenderRadiusAxisTick = (tickFontSize: number) => {
  const RenderRadiusAxisTick = ({ payload, x, y }: { payload: { value: number }; x: number; y: number }) => {
    const value = payload.value;
    const formattedValue = value === 0 ? '0' : value.toLocaleString();

    const charWidth = tickFontSize * 0.6;
    const textWidth = formattedValue.length * charWidth + 12;
    const textHeight = tickFontSize + 8;
    const filterId = `shadow-${value}-${tickFontSize}`;

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
        <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: `${tickFontSize}px`, fill: '#4b5563' }}>
          {formattedValue}
        </text>
      </g>
    );
  };
  
  RenderRadiusAxisTick.displayName = 'RenderRadiusAxisTick';
  return RenderRadiusAxisTick;
};

interface IncentiveModelProps {
  /** Per-round, per-category points and tokens from the rounds API — see page.tsx. */
  categoryDataByRound: Record<number, RoundCategoryEntry[]>;
  /** Round nav labels, from the rounds API — see page.tsx. */
  allRounds: RoundOption[];
  /** The live current-round number (also used as "Go to current round"'s target). */
  currentRound: number;
  /** How many rounds exist — bounds the nav's next/prev and manual-entry input. */
  totalRounds: number;
}

export default function IncentiveModel({ categoryDataByRound, allRounds, currentRound, totalRounds }: IncentiveModelProps) {
  const [selectedRound, setSelectedRound] = useState(currentRound);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [roundInputValue, setRoundInputValue] = useState(String(currentRound));
  const [chartDimensions, setChartDimensions] = useState({ 
    outerRadius: '70%', 
    height: 600, 
    labelFontSize: 14, 
    labelOffset: 20, 
    tickFontSize: 14 
  });
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { 
    onIncentiveModelActivitiesLinkClicked, 
    onIncentiveModelRoundDropdownOpened, 
    onIncentiveModelPrevRoundClicked, 
    onIncentiveModelNextRoundClicked, 
    onIncentiveModelGoToCurrentClicked, 
    onIncentiveModelRoundInputChanged,
    onIncentiveModelTipViewLinkClicked,
    onIncentiveModelLearnMoreClicked 
  } = useAlignmentAssetsAnalytics();

  // Both fields are live now, matched by category name against the API's
  // arrays (a category absent from either response — e.g. Capital, never
  // populated in points, and every category in tokens until the sync job
  // runs — reads 0, same as categories genuinely at 0 this round).
  const currentData = categoryDataByRound[selectedRound] ?? categoryDataByRound[1] ?? [];
  const currentRoundInfo = allRounds.find((r) => r.id === selectedRound);

  // Fixed domain based on analysis of all rounds' data
  // Max token value across all rounds: ~1,800
  // Max points value: 14,000 (Round 2, Projects)
  // Set to 2,000 to better visualize token values (points will be clipped but tokens are the focus)
  const CHART_DOMAIN_MAX = 2000;

  useEffect(() => {
    const updateDimensions = () => {
      if (chartWrapperRef.current) {
        const styles = getComputedStyle(chartWrapperRef.current);
        const outerRadius = styles.getPropertyValue('--chart-outer-radius').trim() || '70%';
        const height = parseInt(styles.getPropertyValue('--chart-height').trim()) || 600;
        const labelFontSize = parseInt(styles.getPropertyValue('--chart-label-font-size').trim()) || 14;
        const labelOffset = parseInt(styles.getPropertyValue('--chart-label-offset').trim()) || 20;
        const tickFontSize = parseInt(styles.getPropertyValue('--chart-tick-font-size').trim()) || 14;
        
        setChartDimensions({
          outerRadius,
          height,
          labelFontSize,
          labelOffset,
          tickFontSize,
        });
      }
    };

    updateDimensions();

    if (chartWrapperRef.current && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        // Small delay to ensure CSS has updated
        setTimeout(updateDimensions, 0);
      });
      resizeObserver.observe(chartWrapperRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = () => {
    if (!isDropdownOpen) {
      onIncentiveModelRoundDropdownOpened(selectedRound);
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handlePrevRound = () => {
    if (selectedRound > 1) {
      const newRound = selectedRound - 1;
      onIncentiveModelPrevRoundClicked(selectedRound, newRound);
      setSelectedRound(newRound);
    }
  };

  const handleNextRound = () => {
    if (selectedRound < totalRounds) {
      const newRound = selectedRound + 1;
      onIncentiveModelNextRoundClicked(selectedRound, newRound);
      setSelectedRound(newRound);
    }
  };

  const handleGoToCurrentRound = () => {
    onIncentiveModelGoToCurrentClicked(selectedRound, currentRound);
    setSelectedRound(currentRound);
    setRoundInputValue(String(currentRound));
    setIsDropdownOpen(false);
  };

  const handleRoundInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setRoundInputValue(value);
  };

  const handleRoundInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const newRound = Number.parseInt(roundInputValue, 10);
      if (!Number.isNaN(newRound) && newRound >= 1 && newRound <= totalRounds) {
        onIncentiveModelRoundInputChanged(newRound);
        setSelectedRound(newRound);
        setIsDropdownOpen(false);
      } else {
        setRoundInputValue(String(selectedRound));
      }
    }
  };

  const handleRoundInputBlur = () => {
    setRoundInputValue(String(selectedRound));
  };

  const handleActivitiesLinkClick = () => {
    onIncentiveModelActivitiesLinkClicked('/alignment-asset/activities');
  };

  const handleTipViewLinkClick = () => {
    onIncentiveModelTipViewLinkClicked('/alignment-asset');
  };

  const handleLearnMoreClick = () => {
    onIncentiveModelLearnMoreClicked('/alignment-asset/faqs#point-to-token-conversion');
  };

  useEffect(() => {
    setRoundInputValue(String(selectedRound));
  }, [selectedRound]);

  useScrollDepthTracking('incentive-model');


  return (
    <>
      <div className="incentive-model">
        {/* Header Section */}
        <section className="incentive-model__header">
          <h1 className="incentive-model__title">Incentive Model</h1>
          <div className="incentive-model__description">
            <p>
              Each snapshot period, a pool of 10,000 PLAA is available to reward participants who complete verified{' '}
              <Link href="https://directory.plnetwork.io/alignment-asset/activities" className="incentive-model__link" onClick={handleActivitiesLinkClick}>
                Incentivized Activities
              </Link>
              . Participants collect points for each verified activity they complete during the snapshot period.
            </p>
            <p>
              Each category receives a fixed allocation of the PLAA pool. At the end of the period, PLAA is distributed proportionally based on each participant&apos;s share of the total points collected in a single category—with up to 10,000 PLAA allocated among all qualifying contributors.
            </p>
            <p>
              When more people contribute in the same category, the PLAA pool is more widely distributed; when activity
              is lower in a category, more PLAA is available per contributor.
            </p>
            <p>
              Available PLAA amounts and allocations for completing incentivized activities may also shift between snapshot periods as the experiment adapts
              to network activity and evolving needs.
            </p>
          </div>
        </section>

        {/* Chart Section Header */}
        <section className="incentive-model__chart-section">
          <div className="incentive-model__chart-header">
            <div className="incentive-model__chart-info">
              <h2 className="incentive-model__chart-title">
                Total Alignment Asset Points &amp; PLAA Collected by category
              </h2>
              <p className="incentive-model__chart-subtitle">
                Showing data for: {currentRoundInfo?.month || 'February 2025'}
              </p>
            </div>

            {/* Round Selector Dropdown */}
            <div className="incentive-model__round-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="incentive-model__round-dropdown-btn"
                onClick={handleDropdownToggle}
              >
                {/* Gradient decoration */}
                <img 
                  src="/images/alignment-assets/gradient.svg" 
                  alt="" 
                  className="incentive-model__round-btn-gradient" 
                />
                <span>Round {selectedRound}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="#64748B"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Dropdown Popover */}
              {isDropdownOpen && (
                <div className="incentive-model__round-popover">
                  <div className="incentive-model__round-nav-row">
                    <span className="incentive-model__round-label">Round</span>
                    <div className="incentive-model__round-nav-controls">
                      <button
                        className="incentive-model__round-nav-arrow"
                        onClick={handlePrevRound}
                        disabled={selectedRound <= 1}
                        aria-label="Previous round"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M10 12L6 8L10 4"
                            stroke={selectedRound <= 1 ? '#94A3B8' : '#64748B'}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <div className="incentive-model__round-number-box">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={roundInputValue}
                          onChange={handleRoundInputChange}
                          onKeyDown={handleRoundInputKeyDown}
                          onBlur={handleRoundInputBlur}
                          className="incentive-model__round-number-input"
                        />
                      </div>
                      <button
                        className="incentive-model__round-nav-arrow"
                        onClick={handleNextRound}
                        disabled={selectedRound >= totalRounds}
                        aria-label="Next round"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M6 4L10 8L6 12"
                            stroke={selectedRound >= totalRounds ? '#94A3B8' : '#64748B'}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <span className="incentive-model__round-of-text">
                      <span className="incentive-model__round-of-label">of</span>
                      <span className="incentive-model__round-total">{totalRounds}</span>
                    </span>
                  </div>

                  {/* <div className="incentive-model__round-divider" /> */}

                  {/* <button className="incentive-model__go-to-current" onClick={handleGoToCurrentRound}>
                    <span>Go to current round</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6H9.5M9.5 6L6 2.5M9.5 6L6 9.5"
                        stroke="#156FF7"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button> */}
                </div>
              )}
            </div>
          </div>

          {/* Current Month Display */}
          {/* <div className="incentive-model__current-month">
            <span className="incentive-model__current-month-label">
              Showing data for: <strong>{currentRoundInfo?.month || 'February 2025'}</strong>
            </span>
          </div> */}
        </section>
        <section className="incentive-model__chart-and-legend-section">
        <div className="incentive-model__legend">
              <div className="incentive-model__legend-item">
                <span className="incentive-model__legend-box incentive-model__legend-box--points" />
                <span className="incentive-model__legend-text">Points</span>
              </div>
              <div className="incentive-model__legend-item">
                <span className="incentive-model__legend-box incentive-model__legend-box--tokens" />
                <span className="incentive-model__legend-text">PLAA</span>
              </div>
          </div>
        {/* Chart and Legend Section */}
        <section className="incentive-model__chart-content">
          <div className="incentive-model__chart-wrapper" ref={chartWrapperRef}>
            <ResponsiveContainer width="100%" height={chartDimensions.height}>
              <RadarChart cx="50%" cy="50%" outerRadius={chartDimensions.outerRadius} data={currentData}>
                <PolarGrid stroke="#e2e8f0" gridType="polygon" radialLines={false} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, CHART_DOMAIN_MAX]}
                  tick={createRenderRadiusAxisTick(chartDimensions.tickFontSize)}
                  tickCount={5}
                  axisLine={false}
                  orientation="middle"
                />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={createRenderPolarAngleAxisTick(chartDimensions.labelFontSize, chartDimensions.labelOffset)} 
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
                  name="PLAA"
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

          <div className="incentive-model__explanation-wrapper">
            {/* Explanation List */}
            <ol className="incentive-model__explanation">
              <li>
                Each category shows the points collected and PLAA distributed for the selected month&apos;s snapshot.
              </li>
              <li>
                More points collected in a category = less PLAA allocated per contributor in that category. Lower
                activity in a category = larger PLAA amounts per contributor.
              </li>
              <li>
                Toggle between months (and rounds) to see how activity and allocations shift over time, and hover over
                any point to view exact values. Green = points; blue = PLAA.
              </li>
            </ol>

            {/* Tip Card */}
            <div className="incentive-model__tip-card">
              <p className="incentive-model__tip-title">
                Top category this snapshot:{' '}
                <span className="incentive-model__tip-category">{getMostActiveCategory(currentData)}</span>.
              </p>
              <p className="incentive-model__tip-text">
                👉{' '}
                <Link href="/alignment-asset" className="incentive-model__tip-link" onClick={handleTipViewLinkClick}>
                  View
                </Link>{' '}
                which categories offer the highest PLAA potential today.
              </p>
            </div>
          </div>
        </section>
        </section>

        {/* Learn More CTA */}
        <section className="incentive-model__learn-more">
          <div className="incentive-model__learn-more-wrapper">
            <div className="incentive-model__learn-more-container">
              <p className="incentive-model__learn-more-text">
                <Link
                  href="/alignment-asset/faqs#point-to-token-conversion"
                  className="incentive-model__learn-more-link"
                  onClick={handleLearnMoreClick}
                >
                  Learn more
                </Link>
                <span className="incentive-model__learn-more-body"> about how points convert to PLAA</span>
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
          flex-direction: column;
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

        /* Round Selector Dropdown */
        .incentive-model__round-dropdown-wrapper {
          position: relative;
        }

        .incentive-model__chart-and-legend-section {
          display: flex;
          flex-direction: column;
        }

        .incentive-model__round-dropdown-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #0f172a;
          line-height: 20px;
          transition: all 0.2s ease;
          min-width: 166px;
          height: 48px;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }

        .incentive-model__round-dropdown-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 8px;
          padding: 1px;
          background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%);
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: -1;
        }

        .incentive-model__round-btn-gradient {
          position: absolute;
          top: 0;
          right: 0;
          width: 132px;
          height: 48px;
          object-fit: cover;
          pointer-events: none;
          z-index: 0;
        }

        .incentive-model__round-dropdown-btn:hover {
          background: rgba(255, 255, 255, 0.95);
        }

        .incentive-model__round-popover {
          position: absolute;
          top: calc(100% + 8px);
          right: 1px;
          background: white;
          border-radius: 4px;
          padding: 8px;
          box-shadow: 0px 2px 6px 0px #0f172a29;
          z-index: 1;
          min-width: 173px;
        }

        .incentive-model__round-nav-row {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 36px;
        }

        .incentive-model__round-label {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          line-height: normal;
        }

        .incentive-model__round-nav-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .incentive-model__round-nav-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.2s ease;
        }

        .incentive-model__round-nav-arrow:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .incentive-model__round-nav-arrow:not(:disabled):hover {
          opacity: 0.7;
        }

        .incentive-model__round-number-box {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 30px;
          height: 24px;
          padding: 0 5px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #0f172a;
          line-height: normal;
        }

        .incentive-model__round-number-input {
          width: 100%;
          text-align: center;
          border: none;
          background: transparent;
          outline: none;
          font-family: 'Inter', sans-serif;
          font-size: 12px !important;
          font-weight: 500;
          color: #0f172a;
          line-height: normal;
          padding: 0;
        }

        .incentive-model__round-of-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          line-height: normal;
        }

        .incentive-model__round-of-label {
          color: #475569;
        }

        .incentive-model__round-total {
          color: #0f172a;
        }

        .incentive-model__round-divider {
          height: 1px;
          background: #e2e8f0;
          margin: 6px 0;
        }

        .incentive-model__go-to-current {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          width: 100%;
          height: 36px;
          padding: 8px;
          background: transparent;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          line-height: normal;
          transition: background 0.2s ease;
        }

        .incentive-model__go-to-current:hover {
          background: #f8fafc;
        }

        .incentive-model__go-to-current svg {
          flex-shrink: 0;
        }

        /* Current Month Display */
        .incentive-model__current-month {
          display: flex;
          padding-top: 16px;
          margin-top: 16px;
        }

        .incentive-model__current-month-label {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #64748b;
          line-height: 22px;
        }

        .incentive-model__current-month-label strong {
          font-weight: 600;
          color: #0f172a;
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
          overflow: visible;
          padding: 0px 25px 25px 50px;
          box-sizing: border-box;
          margin-top: -40px;
          /* CSS Custom Properties - Default values (desktop) */
          --chart-outer-radius: 70%;
          --chart-height: 600;
          --chart-label-font-size: 14;
          --chart-label-offset: 25;
          --chart-tick-font-size: 14;
        }

        .incentive-model__chart-wrapper :global(.recharts-wrapper) {
          overflow: visible !important;
        }

        .incentive-model__chart-wrapper :global(.recharts-surface) {
          overflow: visible !important;
        }

        .incentive-model__explanation-wrapper {
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
          align-self: flex-start;
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
            height: 500px;
            margin-top: 0px;
            padding: 0px 20px 0px 30px;
            --chart-outer-radius: 60%;
            --chart-height: 500;
            --chart-label-font-size: 13;
            --chart-label-offset: 22;
            --chart-tick-font-size: 13;
            margin-top: -20px;
          }

          .incentive-model__explanation-wrapper {
            max-width: 100%;
            width: 100%;
          }
        }

        @media (max-width: 1024px) {
          .incentive-model__chart-wrapper {
            height: 500px;
            margin-top: 0px;
            padding: 0px 20px 0px 30px;
            --chart-outer-radius: 60%;
            --chart-height: 500;
            --chart-label-font-size: 13;
            --chart-label-offset: 22;
            --chart-tick-font-size: 13;
          }
        }

        @media (min-width: 768px) {
        .incentive-model__chart-header {
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
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
            gap: 16px;
          }

          .incentive-model__round-dropdown-wrapper {
            // width: 100%;
            display: flex;
            align-self: flex-end;
            
          }

          .incentive-model__chart-title {
            font-size: 16px;
          }

          .incentive-model__chart-content {
            gap: 32px;
            min-height: auto;
          }

          .incentive-model__chart-wrapper {
            height: 450px;
            margin-top: 0px;
            padding: 0px 15px 0px 25px;
            min-width: 100%;
            --chart-outer-radius: 55%;
            --chart-height: 450;
            --chart-label-font-size: 12;
            --chart-label-offset: 20;
            --chart-tick-font-size: 13;
          }

          .incentive-model__round-dropdown-btn {
            padding: 10px 16px;
            font-size: 13px;
            min-width: 140px;
            height: 42px;
          }

          .incentive-model__round-popover {
            right: 0;
            left: auto;
          }
        }

        @media (min-width: 1024px) {
          .incentive-model__legend {
            align-self: flex-end;
            margin-right: 150px;
          }
        }

        @media (min-width: 1440px) {
          .incentive-model__legend {
            align-self: flex-end;
            margin-right: 180px;
          }
        }

        @media (max-width: 480px) {
          .incentive-model__chart-wrapper {
            min-width: 100%;
            height: 400px;
            margin-top: 0px;
            padding: 0px 12px 0px 20px;
            --chart-outer-radius: 50%;
            --chart-height: 400;
            --chart-label-font-size: 11;
            --chart-label-offset: 18;
            --chart-tick-font-size: 12;
          }

          .incentive-model__round-dropdown-btn {
            width: 100%;
          }

          .incentive-model__round-popover {
            left: 0;
            right: 0;
            min-width: auto;
          }
        }

        @media (max-width: 360px) {
          .incentive-model__chart-wrapper {
            height: 350px;
            padding: 0px 10px 0px 18px;
            --chart-outer-radius: 45%;
            --chart-height: 350;
            --chart-label-font-size: 10;
            --chart-label-offset: 15;
            --chart-tick-font-size: 11;
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
          font-size: 14px;
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
