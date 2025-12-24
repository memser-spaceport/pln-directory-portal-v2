'use client';

import HeroSection from "./sections/hero-section";
import PastLeaderboardSection from "./sections/past-leaderboard-section";
import StatsSection from "./sections/stats-section";
import { IPastRoundData } from "./types/current-round.types";
import PastRoundDescription from "../past-rounds/past-round-description";
import SupportSection from "./sections/support-section";
import BuybackSimulationSection from "./sections/buyback-simulation-section";

interface PastRoundComponentProps {
  pastRoundData: IPastRoundData;
}

export default function PastRoundComponent({ pastRoundData }: PastRoundComponentProps) {
  const data = pastRoundData;
  return (
    <>
      <div className="past-round">
        <HeroSection data={data.hero} />
        <PastRoundDescription roundNumber={data.meta.roundNumber} month={data.meta.month} year={data.meta.year} />
        <StatsSection data={data.stats} />
        <PastLeaderboardSection roundNumber={data.meta.roundNumber} leaderboardData={data.leaderboard} />
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
          .past-round {
            padding: 24px;
          }
          
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
