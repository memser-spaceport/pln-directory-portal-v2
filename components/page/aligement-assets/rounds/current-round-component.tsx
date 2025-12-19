'use client';

import { useState, useMemo } from 'react';
import HeroSection from './sections/hero-section';
import RoundDescriptionSection from './sections/round-description-section';
import SnapshotProgressSection from './sections/snapshot-progress-section';
import ChartSection from './sections/chart-section';
import StatsSection from './sections/stats-section';
import LeaderboardSection from './sections/leaderboard-section';
import BuybackAuctionSection from './sections/buyback-auction-section';
import LearnMoreSection from './sections/learn-more-section';
import DisclaimerSection from './sections/disclaimer-section';
import SupportSection from './sections/support-section';
import { currentRoundData } from './data';
import { CurrentRoundData } from './types';

interface CurrentRoundComponentProps {
  currentRound?: number;
  totalRounds?: number;
  onRoundChange?: (round: number) => void;
  /** Optional: Override the default data with custom data */
  data?: CurrentRoundData;
}

/**
 * CurrentRoundComponent - Main component for displaying current round information
 * Uses master JSON data from ./data/current-round.data.ts
 */
export default function CurrentRoundComponent({
  data = currentRoundData
}: CurrentRoundComponentProps) {
  const [leaderboardView, setLeaderboardView] = useState<'current' | 'alltime'>('current');

  // Parse dates from the master data
  const { startDate, endDate } = useMemo(() => {
    return {
      startDate: new Date(data.snapshotProgress.startDate),
      endDate: new Date(data.snapshotProgress.endDate)
    };
  }, [data.snapshotProgress.startDate, data.snapshotProgress.endDate]);

  return (
    <>
      <div className="current-round">
        {/* Round Selector - Commented out for now */}
        {/* <div className="current-round__round-selector">
          <PlaaRoundSelector
            currentRound={currentRound || data.meta.roundNumber}
            totalRounds={totalRounds || 12}
            onRoundChange={onRoundChange || (() => {})}
          />
        </div> */}

        {/* Hero Section with Title and Action Buttons */}
        <HeroSection data={data.hero} />

        {/* Round Description Section */}
        <RoundDescriptionSection data={data.roundDescription} />

        {/* Total Alignment Asset Points & Tokens Collected by Category */}
        <SnapshotProgressSection 
          startDate={startDate}
          endDate={endDate}
          tipContent={data.snapshotProgress.tipContent}
        />

        {/* Chart Section - Total Points Per KPI Pillar */}
        <ChartSection data={data.chart} />

        {/* Statistics Section */}
        <StatsSection data={data.stats} />

        {/* Points Leaderboard Section */}
        <LeaderboardSection 
          view={leaderboardView}
          onViewChange={setLeaderboardView}
          currentSnapshotData={data.leaderboard.currentSnapshotData}
          cumulativeData={data.leaderboard.cumulativeData}
        />

        {/* Buyback Auction Results Section */}
        <BuybackAuctionSection data={data.buybackAuction} />

        {/* Learn More Section */}
        <LearnMoreSection data={data.learnMore} />

        {/* Disclaimer Section */}
        <DisclaimerSection data={data.disclaimer} />

        {/* Support Section */}
        <SupportSection data={data.support} />
      </div>

      <style jsx>{`
        .current-round {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 64px;
          padding: 0;
        }

        .current-round__round-selector {
          display: none;
        }

        @media (max-width: 1024px) {
          .current-round__round-selector {
            display: block;
            padding: 20px 24px;
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
          }
        }

        @media (max-width: 768px) {
          .current-round {
            gap: 48px;
          }
        }
      `}</style>
    </>
  );
}
