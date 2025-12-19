'use client';

interface PastRoundComponentProps {
  selectedRound: number;
  totalRounds: number;
  onRoundChange: (round: number) => void;
}

export default function PastRoundComponent({
  selectedRound,
  totalRounds,
  onRoundChange
}: PastRoundComponentProps) {
  return (
    <>
      <div className="past-round">
        <div className="past-round__content">
          <h1 className="past-round__title">Round {selectedRound}</h1>
          <p className="past-round__description">
            This is a past round. Historical data and results for Round {selectedRound} will be displayed here.
          </p>
          
          <div className="past-round__placeholder">
            <p>Past round content coming soon...</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .past-round {
          width: 100%;
          padding: 48px;
          min-height: 400px;
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
