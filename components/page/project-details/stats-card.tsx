'use client';

import Image from 'next/image';

interface IStatsCard {
  statsName: string;
  count: number;
  icon: string;
  newContributors?: number;
}

const StatsCard = (props: IStatsCard) => {
  const statsName = props?.statsName;
  const count = props?.count;
  const icon = props?.icon;
  const newContributors = props?.newContributors ?? 0;

  return (
    <>
      <div className="statsCard">
        <p className="statsCard__count">
          {count}{' '}
          {statsName === 'Contributors' && newContributors > 0 && (
            <span className="statsCard__count__new">{`(${newContributors} New)`}</span>
          )}
        </p>
        <div className="statsCard__cn">
          <Image className="statsCard__cn__img" src={icon} alt="icon" height={16} width={16} />
          <span className="statsCard__cn__name">{statsName}</span>
        </div>
        {statsName === 'Contributors' && newContributors > 0 && (
          <span className="statsCard__duration">Last 6 months</span>
        )}
      </div>
      <style jsx>{`
        .statsCard {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .statsCard__count {
          font-size: 24px;
          font-weight: 700;
          line-height: 32px;
          letter-spacing: 0px;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .statsCard__count__new {
          font-size: 10px;
          font-weight: 600;
          line-height: 18px;
          color: #30c593;
        }

        .statsCard__cn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .statsCard__cn__name {
          font-size: 13px;
          font-weight: 400;
          line-height: 18px;
          color: #64748b;
        }

        .statsCard__duration {
          padding: 4px;
          font-size: 10px;
          font-weight: 400;
          line-height: 18px;
          color: #0f172a;
          background-color: #f1f5f9;
          padding-left: 4px;
          padding-right: 4px;
        }
      `}</style>
    </>
  );
};

export default StatsCard;
