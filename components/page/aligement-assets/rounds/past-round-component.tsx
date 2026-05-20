'use client';

import { useMemo, useState } from 'react';
import HeroSection from "./sections/hero-section";
import PastLeaderboardSection from "./sections/past-leaderboard-section";
import StatsSection from "./sections/stats-section";
import { IPastRoundData, LeaderboardEntry } from "./types/current-round.types";
import PastRoundDescription from "../past-rounds/past-round-description";
import SupportSection from "./sections/support-section";
import BuybackSimulationSection from "./sections/buyback-simulation-section";
import PointsDashboard from '@/components/page/aligement-assets/points-dashboard/points-dashboard';
import { currentRoundData } from './data';
import { useScrollDepthTracking } from '@/hooks/useScrollDepthTracking';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import {
  getPastRoundLeaderboardEntries,
  LeaderboardApiResponse,
} from '@/services/plaa/leaderboard.utils';

interface PastRoundComponentProps {
  pastRoundData: IPastRoundData;
  /** Raw leaderboard API response; PAST_ROUND entries are used for this round's table */
  leaderboardResponse?: LeaderboardApiResponse;
}

export default function PastRoundComponent({ pastRoundData, leaderboardResponse }: PastRoundComponentProps) {
  const data = pastRoundData;
  const [isLoggedIn] = useState(() => typeof window !== 'undefined' && !!getCookiesFromClient().authToken);

  const resolvedLeaderboard: LeaderboardEntry[] = useMemo(() => {
    if (leaderboardResponse?.entries?.length) {
      return getPastRoundLeaderboardEntries(leaderboardResponse.entries);
    }
    return data.leaderboard;
  }, [leaderboardResponse, data.leaderboard]);

  useScrollDepthTracking(`past-round-${data.meta.roundNumber}`);

  return (
    <>
      <div className="past-round">
        <HeroSection data={data.hero} />
        {isLoggedIn && <PointsDashboard
          currentRound={currentRoundData.meta.roundNumber}
          pageRound={data.meta.roundNumber}
        />}
        <PastRoundDescription 
          roundNumber={data.meta.roundNumber} 
          month={data.meta.month} 
          year={data.meta.year}
          tokensAllocated={data.stats.totalTokensAvailable}
        />
        <StatsSection data={data.stats} />
        {isLoggedIn && resolvedLeaderboard.length > 0 && (
          <PastLeaderboardSection
            roundNumber={data.meta.roundNumber}
            leaderboardData={resolvedLeaderboard}
          />
        )}
        {data.buybackSimulation && <BuybackSimulationSection data={data.buybackSimulation} />}
        <SupportSection />
      </div>

      <style jsx>{`
        .past-round {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 64px;
          padding: 0;
        }

        .past-round__content {
          max-width: 1170px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          align-items: center;
          text-align: center;
        }

        .past-round__title {
          font-size: 32px;
          font-weight: 700;
          line-height: 40px;
          color: #0f172a;
          margin: 0;
        }

        .past-round__description {
          font-size: 16px;
          font-weight: 400;
          line-height: 24px;
          color: #475569;
          margin: 0;
          max-width: 600px;
        }

        .past-round__placeholder {
          padding: 64px 32px;
          background-color: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
        }

        .past-round__placeholder p {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #64748b;
          margin: 0;
        }

        @media (max-width: 768px) {
          
          .past-round__title {
            font-size: 24px;
            line-height: 32px;
          }
          
          .past-round__placeholder {
            padding: 32px 16px;
          }
        }
      `}</style>
    </>
  );
}
